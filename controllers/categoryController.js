const CategoryModel = require('../models/categoryModel');
const ProductModel = require('../models/productModel');

exports.getAllCategories = async (req, res) => {
  try {
    const data = await CategoryModel.getAll();
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCategoryById = async (req, res) => {
  const { id } = req.params;
  try {
    const data = await CategoryModel.findById(id);
    if (!data) return res.status(404).json({ success: false, message: 'Category not found' });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createCategory = async (req, res) => {
  const { category_name } = req.body;
  try {
    const existing = await CategoryModel.findByName(category_name);
    if (existing) {
      return res.status(400).json({ success: false, message: 'Tên danh mục đã tồn tại' });
    }
    const data = await CategoryModel.create(req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateCategory = async (req, res) => {
  const { id } = req.params;
  const { category_name } = req.body;
  try {
    const existing = await CategoryModel.findByName(category_name);
    if (existing && existing.id != id) {
      return res.status(400).json({ success: false, message: 'Tên danh mục đã trùng với danh mục khác' });
    }
    const data = await CategoryModel.update(id, req.body);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteCategory = async (req, res) => {
  const { id } = req.params;
  try {
    const products = await ProductModel.getAll(id);
    if (products.length > 0) {
      return res.status(400).json({ success: false, message: 'Không thể xóa danh mục đang có chứa sản phẩm' });
    }

    await CategoryModel.delete(id);
    res.status(200).json({ success: true, message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
