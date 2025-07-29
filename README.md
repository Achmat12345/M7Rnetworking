
# M7Rnetworking Project

## Setup Instructions

1. Install dependencies
   - Backend: `npm install express dotenv`
   - Frontend: (if using React/Next.js, set up accordingly)

2. Create a `.env` file in the root folder and add your keys:
```
MONGO_URI=your_mongodb_atlas_connection_string
PAYFAST_MERCHANT_ID=your_merchant_id
PAYFAST_MERCHANT_KEY=your_merchant_key
PAYFAST_PASSPHRASE=your_passphrase
JWT_SECRET=your_jwt_secret_key
```

3. Run the backend server
```
node server/index.js
```

4. Open `client/index.html` in your browser for the landing page.

## Notes
- AI assistant prompt templates are in `ai-assistant/prompts.js`.
- Payment integration using PayFast is configured in `config/payfast.js`.
- MongoDB connection string config is in `config/db.js`.
