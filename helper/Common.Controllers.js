// controllers/mainCategoryController.js
const MainCategory = require("../models/Category");

const buildCategoryTree = (category, categories) => {
  // Find all subcategories of the current category
  const subCategories = categories.filter(
    (cat) =>
      cat.parentCategory &&
      String(cat.parentCategory._id) === String(category._id)
  );

  // Convert the category to an object to manipulate fields
  const categoryObj = category.toObject();

  // Check if the category has subcategories
  const hasSubCategory = subCategories.length > 0;

  // Remove `parentCategory` field if `hasSubCategory` is true
  if (hasSubCategory) {
    delete categoryObj.parentCategory;
    delete categoryObj.Price;
    delete categoryObj.createdAt;
    delete categoryObj.updatedAt;
    delete categoryObj.__v;
    // Add subcategories only if `hasSubCategory` is true
    return {
      ...categoryObj,
      hasSubCategory,
      subCategories: subCategories.map((subCat) =>
        buildCategoryTree(subCat, categories)
      ), // Recursively build the tree
    };
  } else {
    // Remove additional fields if `hasSubCategory` is false
    delete categoryObj.parentCategory;
    delete categoryObj.__v;

    // Return without the `subCategories` field
    return {
      ...categoryObj,
      hasSubCategory,
    };
  }
};

const getAllCatTree = async (req, res) => {
  try {
    // Fetch all categories, including parent references
    const categories = await MainCategory.find();

    // Filter out main categories (those without a parent category)
    const mainCategories = categories.filter(
      (category) => !category.parentCategory
    );

    // Build a tree structure by recursively adding subcategories
    const categoryTree = mainCategories.map((category) =>
      buildCategoryTree(category, categories)
    );

    return res.send({
      status: true,
      Categories: categoryTree,
    });
  } catch (error) {
    console.error("Error getting category:", error.message);
    return res.send({
      status: false,
      message: "something went wrong",
    });
  }
};

module.exports = {
  getAllCatTree,
};
