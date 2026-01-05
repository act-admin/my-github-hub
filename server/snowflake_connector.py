import snowflake.connector
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.backends import default_backend
from config import (
    SNOWFLAKE_USER, SNOWFLAKE_PASSWORD, SNOWFLAKE_PRIVATE_KEY, SNOWFLAKE_ACCOUNT,
    SNOWFLAKE_WAREHOUSE, SNOWFLAKE_DATABASE, SNOWFLAKE_SCHEMA
)

def execute_sql(sql: str):
    """
    Executes SQL on Snowflake and returns results.
    Supports both password and key-pair authentication.
    """
    connection_params = {
        'user': SNOWFLAKE_USER,
        'account': SNOWFLAKE_ACCOUNT,
        'warehouse': SNOWFLAKE_WAREHOUSE,
        'database': SNOWFLAKE_DATABASE,
        'schema': SNOWFLAKE_SCHEMA
    }
    
    # Use key-pair authentication if private key is available
    if SNOWFLAKE_PRIVATE_KEY:
        try:
            # Handle private key formatting - replace literal \n with actual newlines
            private_key_str = SNOWFLAKE_PRIVATE_KEY.replace('\\n', '\n')
            
            # Ensure proper PEM format with headers if missing
            if not private_key_str.startswith('-----BEGIN'):
                private_key_str = f"-----BEGIN PRIVATE KEY-----\n{private_key_str}\n-----END PRIVATE KEY-----"
            
            # Load and parse the private key
            private_key_obj = serialization.load_pem_private_key(
                private_key_str.encode(),
                password=None,
                backend=default_backend()
            )
            
            # Serialize to DER format (required by Snowflake connector)
            pkb = private_key_obj.private_bytes(
                encoding=serialization.Encoding.DER,
                format=serialization.PrivateFormat.PKCS8,
                encryption_algorithm=serialization.NoEncryption()
            )
            
            connection_params['private_key'] = pkb
            print("🔐 Using key-pair authentication for Snowflake")
        except Exception as e:
            print(f"⚠️  Failed to load private key: {e}")
            if SNOWFLAKE_PASSWORD:
                connection_params['password'] = SNOWFLAKE_PASSWORD
                print("🔑 Falling back to password authentication")
            else:
                raise ValueError("No valid authentication method available")
    elif SNOWFLAKE_PASSWORD:
        connection_params['password'] = SNOWFLAKE_PASSWORD
        print("🔑 Using password authentication for Snowflake")
    else:
        raise ValueError("No authentication credentials provided (password or private key)")
    
    conn = snowflake.connector.connect(**connection_params)
    cur = conn.cursor()
    try:
        cur.execute(sql)
        results = cur.fetchall()
        return results
    except Exception as e:
        raise RuntimeError(f"Snowflake execution error: {e}")
    finally:
        cur.close()
        conn.close()