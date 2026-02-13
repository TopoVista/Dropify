from app.db.database import engine


def test_db_connection():
    connection = engine.connect()
    connection.close()
