import psycopg2
from psycopg2.extras import RealDictCursor
import json
from datetime import datetime

DB_CONFIG = {
    "dbname": "postgres",
    "user": "postgres",
    "password": 1234,
    "host": "localhost",
    "port": 5432
}

def calculate_change(new_price, old_price):
    if not old_price:
        return 0, 0
    change = new_price - old_price
    percent = (change / old_price) * 100
    return round(change, 2), round(percent, 2)


def update_stock_and_notify(symbol, user_id, latest):
    """
    latest = {
        "open": float,
        "high": float,
        "low": float,
        "close": float
    }
    """

    conn = None
    cur = None

    try:
        # ✅ Validate numeric OHLC
        for key in ("open", "high", "low", "close"):
            if latest.get(key) is None:
                print(f"Invalid OHLC data for {symbol}: {latest}")
                return

        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor(cursor_factory=RealDictCursor)

        # 🔹 Fetch previous price
        cur.execute("""
            SELECT last_traded_price
            FROM stock_data
            WHERE symbol = %s
        """, (symbol,))
        row = cur.fetchone()

        if not row:
            print(f"Stock {symbol} not found in DB")
            return

        old_price = float(row["last_traded_price"] or 0)
        new_price = float(latest["close"])

        # 🔹 Calculate change
        price_change, percent_change = calculate_change(new_price, old_price)

        # 🔔 Insert notification ONLY if price changed
        if price_change != 0:
            direction = "UP" if price_change > 0 else "DOWN"

            notification_payload = {
                "previous_price": old_price,
                "current_price": new_price,
                "change": price_change,
                "change_percent": percent_change,
                "direction": direction
            }

            cur.execute("""
                INSERT INTO notifications
                    (user_id, type, title, message, symbol, data, is_read, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                user_id,
                "STOCK_ALERT",
                "Stock Price Update",
                f"{symbol} {direction} by {price_change} ({percent_change}%)",
                symbol,
                json.dumps(notification_payload),
                False,
                datetime.utcnow()
            ))

        # 🔹 Update stock_data
        cur.execute("""
            UPDATE stock_data SET
                open_price = %s,
                high_price = %s,
                low_price = %s,
                previous_close = %s,
                last_traded_price = %s,
                price_change = %s,
                percentage_change = %s,
                daypercentagechange = %s
            WHERE symbol = %s
        """, (
            latest["open"],
            latest["high"],
            latest["low"],
            latest["open"],  # previous_close (correct)
            new_price,
            price_change,
            percent_change,
            percent_change,
            symbol
        ))

        conn.commit()
        print(f"Stock {symbol} updated & notification inserted for user {user_id} ✅")

    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Notification error for {symbol}: {e}")

    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()
