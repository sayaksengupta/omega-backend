const express = require("express");
const Transaction = require("../models/transactions");
const router = express.Router();


router.get("/", (req, res) => {
  res.json({ message: "This is the transaction api" });
});


router.post('/add-transaction', async (req, res) => {
    try {
      const { payerName, payerType, status, amount, commission, txnId, mode } = req.body;
  
      // Create a new transaction instance
      const newTransaction = new Transaction({
        payerName,
        payerType,
        status,
        amount,
        commission,
        txnId,
        mode
      });
  
      // Save the transaction to the database
      await newTransaction.save();
  
      res.status(201).json({ message: 'Transaction added successfully', success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to add transaction', success: false });
    }
});

router.delete('/delete-transaction/:id', async (req, res) => {
    try {
      const transactionId = req.params.id;
  
      // Find and delete the transaction
      await Transaction.findByIdAndDelete(transactionId);
  
      res.json({ message: 'Transaction deleted successfully', success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete transaction', success: false });
    }
});

router.put('/toggle-transaction/:id', async (req, res) => {
    try {
      const transactionId = req.params.id;
  
      // Find the transaction by ID
      const transaction = await Transaction.findById(transactionId);
  
      // Toggle the status
      transaction.status = transaction.status === 0 ? 1 : 0;
  
      // Save the updated transaction
      await transaction.save();
  
      res.json({ message: 'Transaction status toggled successfully', success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to toggle transaction status', success: false });
    }
});

router.get('/get-all-transactions', async (req, res) => {
    try {
      // Retrieve all transactions from the database
      const transactions = await Transaction.find();
  
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get transactions' });
    }
});
  

module.exports = router;