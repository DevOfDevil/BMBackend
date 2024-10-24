// controllers/mainCategoryController.js
const MainCategory = require("../../models/Category");
const QuizMdl = require("../../models/Quiz");

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
    const categories = await MainCategory.find({ isDeleted: false });

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
    const categories = await MainCategory.find({ isDeleted: false });

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

const getCategoryById = async (req, res) => {
  try {
    const { catID } = req.params;
    const Category = await MainCategory.findById({ _id: catID });
    if (!Category) {
      return res.send({
        status: false,
        message: "category not found",
      });
    }
    return res.send({
      status: true,
      Category: Category,
    });
  } catch (error) {
    return res.send({
      status: false,
      message: "something went wrong!" + error.message,
    });
  }
};
const deleteCategory = async (req, res) => {
  try {
    const catID = req.params.catID;
    const findCategory = await MainCategory.find({ parentCategory: catID });
    if (findCategory.length) {
      return res.send({
        status: false,
        message: "Category has sub categories!",
      });
    }
    const findQuiz = await QuizMdl.find({ Category: catID });
    if (findQuiz) {
      return res.send({
        status: false,
        message: "Category has quizzes in it.You cannot delete this",
      });
    }

    const deleteCat = await OnlineclassMdl.findByIdAndUpdate(catID, {
      isDeleted: true,
      updated: Date.now(),
    });

    // Fetch all categories, including parent references
    const categories = await MainCategory.find({ isDeleted: false });

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
    return res.send({
      status: false,
      message: "something went wrong!",
    });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { name, description, parentCategory, Price, catID } = req.body;
    const mainCategory = await MainCategory.findByIdAndUpdate(
      catID,
      {
        name: name,
        description: description,
        Price: Price,
        updated: Date.now(),
      },
      { new: true }
    );

    if (mainCategory) {
      return res.send({
        status: true,
        Category: mainCategory,
      });
    } else
      return res.send({
        status: false,
        message: "something went wrong!",
      });
  } catch (error) {
    return res.send({
      status: false,
      message: "something went wrong!",
    });
  }
};

module.exports = {
  addCategory,
  ListAll,
  getCategoryById,
  deleteCategory,
  updateCategory,
};
