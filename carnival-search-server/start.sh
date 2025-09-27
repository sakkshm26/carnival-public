set -e

npm run migrations:push
echo "Migrations completed successfully."

echo "Starting the server..."
npm start