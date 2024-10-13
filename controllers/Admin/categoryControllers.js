// controllers/mainCategoryController.js
const MainCategory = require("../../models/Category");

const addCategory = async (req, res) => {
  try {
    const { name, description, parentCategory, Price = 0.0 } = req.body;

    // Check if parentCategory is provided and exists in the database
    let parentCategoryDoc = null;
    if (parentCategory) {
      parentCategoryDoc = await MainCategory.findById(parentCategory);
      if (!parentCategoryDoc) {
        return res.send({
          status: false,
          message: "Invalid parent category.",
        });
      }
    }

    const mainCategory = new MainCategory({
      name,
      description,
      parentCategory: parentCategoryDoc ? parentCategoryDoc._id : null,
      Price,
    });

    await mainCategory.save();

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
    console.error("Error creating category:", error.message);
    return res.send({
      status: false,
      message: "Something went wrong",
    });
  }
};
/*
const ListAll = async (req, res) => {
  try {
    // Fetch all categories, including parent references.
    const categories = await MainCategory.find().populate("parentCategory");

    // Create a map to store the hierarchical structure
    const categoryMap = {};

    // Organize categories into a tree-like structure
    categories.forEach((category) => {
      if (!category.parentCategory) {
        // This is a main category (no parent)
        categoryMap[category._id] = {
          ...category.toObject(),
          subCategories: [],
        };
      } else {
        // This is a subcategory (has a parent)
        const parentId = category.parentCategory._id;
        if (!categoryMap[parentId]) {
          // If the parent doesn't exist in the map yet, add it
          categoryMap[parentId] = {
            ...category.parentCategory.toObject(),
            subCategories: [],
          };
        }
        // Add this subcategory to its parent's `subCategories` array
        categoryMap[parentId].subCategories.push(category);
      }
    });

    // Get only the main categories from the map
    const mainCategories = Object.values(categoryMap).filter(
      (category) => !category.parentCategory
    );

    return res.send({
      status: true,
      Categories: mainCategories,
    });
  } catch (error) {
    console.error("Error getting category:", error.message);
    return res.send({
      status: false,
      message: "something went wrong",
    });
  }
};
*/
/*
const buildCategoryTree = (category, categories) => {
  const subCategories = categories.filter(
    (cat) =>
      cat.parentCategory &&
      String(cat.parentCategory._id) === String(category._id)
  );

  return {
    ...category.toObject(),
    subCategories: subCategories.map((subCat) =>
      buildCategoryTree(subCat, categories)
    ), // Recursively build the tree
  };
};
*/
/*
const buildCategoryTree = (category, categories) => {
  // Find all subcategories of the current category
  const subCategories = categories.filter(
    (cat) =>
      cat.parentCategory &&
      String(cat.parentCategory._id) === String(category._id)
  );

  // Check if there are any subcategories and set `hasSubCategory` flag
  return {
    ...category.toObject(),
    hasSubCategory: subCategories.length > 0, // Add hasSubCategory flag
    subCategories: subCategories.map((subCat) =>
      buildCategoryTree(subCat, categories)
    ), // Recursively build the tree
  };
};
*/
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

const ListAll = async (req, res) => {
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

/*
const getMainCategoryById = async (req, res) => {
  try {
    const mainCategory = await MainCategory.findById(req.params.id).populate(
      "parentCategory"
    );
    if (!mainCategory) {
      return res.status(404).json({ message: "Main category not found" });
    }
    res.status(200).json(mainCategory);
  } catch (error) {
    res.status(500).json({ message: "Error fetching main category", error });
  }
};

const updateMainCategory = async (req, res) => {
  try {
    const mainCategory = await MainCategory.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate("parentCategory");
    if (!mainCategory) {
      return res.status(404).json({ message: "Main category not found" });
    }
    res
      .status(200)
      .json({ message: "Main category updated successfully", mainCategory });
  } catch (error) {
    res.status(500).json({ message: "Error updating main category", error });
  }
};

const deleteMainCategory = async (req, res) => {
  try {
    const mainCategory = await MainCategory.findByIdAndDelete(req.params.id);
    if (!mainCategory) {
      return res.status(404).json({ message: "Main category not found" });
    }
    res.status(200).json({ message: "Main category deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting main category", error });
  }
};
*/
module.exports = {
  addCategory,
  ListAll,
};
