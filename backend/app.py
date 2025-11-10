from flask import Flask, send_from_directory
import os

# Path to the frontend build folder (one level above)
app = Flask(__name__, static_folder='../dist', static_url_path='')

@app.route('/')
def serve_index():
    return send_from_directory(app.static_folder, 'index.html')

# Handle all other routes (for React Router)
@app.errorhandler(404)
def not_found(e):
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    # Run on port 5000
    app.run(debug=True,port=5000)