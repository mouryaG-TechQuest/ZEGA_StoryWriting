import mysql.connector
import sys

def fix_db():
    try:
        conn = mysql.connector.connect(
            host="localhost",
            user="root",
            password="root",
            database="storydb"
        )
        cursor = conn.cursor()
        
        print("Connected to database...")
        
        # Check if column exists
        cursor.execute("SHOW COLUMNS FROM stories LIKE 'show_scene_timeline'")
        result = cursor.fetchone()
        
        if not result:
            print("Adding show_scene_timeline column...")
            cursor.execute("ALTER TABLE stories ADD COLUMN show_scene_timeline BOOLEAN NOT NULL DEFAULT TRUE")
            conn.commit()
            print("Column added successfully.")
        else:
            print("Column show_scene_timeline already exists.")
            
        cursor.close()
        conn.close()
        print("Database fix completed.")
        
    except mysql.connector.Error as err:
        print(f"Error: {err}")
        sys.exit(1)
    except Exception as e:
        print(f"Unexpected error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    fix_db()
