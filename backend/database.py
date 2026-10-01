import os
import logging
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
import pymysql

load_dotenv(override=True)

logger = logging.getLogger("database")
logging.basicConfig(level=logging.INFO)

Base = declarative_base()

class DBManager:
    def __init__(self):
        self.engine = None
        self.SessionLocal = None
        self.db_type = "sqlite"
        self.is_connected = False
        self.error_message = None
        self.init_database()

    def get_mysql_credentials(self):
        load_dotenv(override=True)
        return {
            "host": os.getenv("MYSQL_HOST", "localhost"),
            "port": int(os.getenv("MYSQL_PORT", "3306")),
            "user": os.getenv("MYSQL_USER", "root"),
            "password": os.getenv("MYSQL_PASSWORD", ""),
            "database": os.getenv("MYSQL_DB", "career_ai")
        }

    def try_init_mysql(self, host, port, user, password, database):
        """Attempts to ensure MySQL database exists and create SQLAlchemy engine."""
        try:
            # 1. First connect to MySQL server without database to create DB if needed
            temp_conn = pymysql.connect(
                host=host,
                port=port,
                user=user,
                password=password,
                charset='utf8mb4',
                connect_timeout=3
            )
            with temp_conn.cursor() as cursor:
                cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{database}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
            temp_conn.commit()
            temp_conn.close()

            # 2. Connect with SQLAlchemy
            # URL escape password if needed
            encoded_password = pymysql.converters.escape_string(password)
            mysql_url = f"mysql+pymysql://{user}:{password}@{host}:{port}/{database}?charset=utf8mb4"
            engine = create_engine(
                mysql_url,
                pool_pre_ping=True,
                pool_recycle=3600,
                echo=False
            )
            # Test engine connection
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))

            self.engine = engine
            self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
            self.db_type = "mysql"
            self.is_connected = True
            self.error_message = None
            logger.info(f"Successfully connected to MySQL database '{database}' on {host}:{port}")
            return True, "Connected to MySQL successfully"
        except Exception as e:
            err_msg = str(e)
            logger.warning(f"Failed to connect to MySQL: {err_msg}")
            return False, err_msg

    def init_database(self):
        creds = self.get_mysql_credentials()
        success, msg = self.try_init_mysql(
            creds["host"], creds["port"], creds["user"], creds["password"], creds["database"]
        )
        if not success:
            logger.info("Falling back to local SQLite database (sqlite:///./career_ai.db)...")
            self.engine = create_engine(
                "sqlite:///./career_ai.db",
                connect_args={"check_same_thread": False}
            )
            self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
            self.db_type = "sqlite"
            self.is_connected = True
            self.error_message = f"MySQL unavailable ({msg}). Using SQLite fallback."

    def sync_schema(self):
        """Inspects existing tables and automatically adds any missing columns defined in models."""
        if not self.engine:
            return
        try:
            from sqlalchemy import inspect
            inspector = inspect(self.engine)
            with self.engine.begin() as conn:
                for table_name, table in Base.metadata.tables.items():
                    if inspector.has_table(table_name):
                        existing_cols = {c['name'] for c in inspector.get_columns(table_name)}
                        for column in table.columns:
                            if column.name not in existing_cols:
                                col_type = column.type.compile(self.engine.dialect)
                                logger.info(f"Migrating schema: Adding missing column '{column.name}' ({col_type}) to table '{table_name}'")
                                alter_stmt = text(f"ALTER TABLE {table_name} ADD COLUMN {column.name} {col_type}")
                                conn.execute(alter_stmt)
        except Exception as e:
            logger.warning(f"Notice during schema synchronization: {e}")

    def get_status(self):
        creds = self.get_mysql_credentials()
        return {
            "active_db": self.db_type,
            "connected": self.is_connected,
            "mysql_host": creds["host"],
            "mysql_user": creds["user"],
            "mysql_db": creds["database"],
            "mysql_port": creds["port"],
            "has_mysql_password": bool(creds["password"]),
            "notice": self.error_message
        }

db_manager = DBManager()

def get_db():
    db = db_manager.SessionLocal()
    try:
        yield db
    finally:
        db.close()
