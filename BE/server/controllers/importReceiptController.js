const importReceiptService = require("../services/importReceiptService");

exports.getReceipts = async (req, res) => {
  try {
    const receipts = await importReceiptService.getReceipts();
    return res.json(receipts);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};

exports.getReceiptById = async (req, res) => {
  try {
    const receipt = await importReceiptService.getReceiptById(req.params.id);
    return res.json(receipt);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};

exports.createReceipt = async (req, res) => {
  try {
    const receipt = await importReceiptService.createReceipt(
      req.user._id,
      req.body,
    );
    return res.status(201).json(receipt);
  } catch (error) {
    return res.status(error.statusCode || 400).json({ message: error.message });
  }
};
