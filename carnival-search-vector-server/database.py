import os
import psycopg2
from psycopg2.extras import RealDictCursor
from psycopg2.pool import SimpleConnectionPool
from psycopg2.extensions import connection as psycopg2_connection
from contextlib import contextmanager
from typing import Optional, Generator
from dotenv import load_dotenv

load_dotenv(override=True)

# Database configuration
DB_CONFIG = {
    'host': os.getenv('DB_HOST'),
    'port': os.getenv('DB_PORT'),
    'database': os.getenv('DB_NAME'),
    'user': os.getenv('DB_USERNAME'),
    'password': os.getenv('DB_PASSWORD'),
}

# Global connection pool
_connection_pool = None

def initialize_db_pool(min_connections: int = 1, max_connections: int = 10) -> bool:
    """Initialize the database connection pool"""
    global _connection_pool
    try:
        _connection_pool = SimpleConnectionPool(
            min_connections,
            max_connections,
            host=DB_CONFIG['host'],
            port=DB_CONFIG['port'],
            database=DB_CONFIG['database'],
            user=DB_CONFIG['user'],
            password=DB_CONFIG['password'],
            cursor_factory=RealDictCursor
        )
        print("Database connection pool initialized successfully")
        return True
    except Exception as e:
        print(f"Failed to initialize database pool: {e}")
        return False

def get_db_connection() -> psycopg2_connection:
    """Get a database connection from the pool"""
    global _connection_pool
    if _connection_pool is None:
        raise Exception("Database pool not initialized. Call initialize_db_pool() first.")
    return _connection_pool.getconn()

def return_db_connection(connection: psycopg2_connection) -> None:
    """Return a connection to the pool"""
    global _connection_pool
    if _connection_pool is not None:
        _connection_pool.putconn(connection)

@contextmanager
def get_db_cursor() -> Generator[RealDictCursor, None, None]:
    """Context manager for database cursor using connection pool"""
    connection = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        yield cursor
        connection.commit()
    except Exception as e:
        if connection:
            connection.rollback()
        raise e
    finally:
        if cursor:
            cursor.close()
        if connection:
            return_db_connection(connection)

def close_db_pool() -> None:
    """Close the database connection pool"""
    global _connection_pool
    if _connection_pool is not None:
        _connection_pool.closeall()
        _connection_pool = None
        print("Database connection pool closed")