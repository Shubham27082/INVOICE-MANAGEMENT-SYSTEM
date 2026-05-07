// Sample controller
exports.getSample = async (req, res) => {
  try {
    res.json({ message: 'Sample API endpoint working' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
