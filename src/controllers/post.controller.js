import mongoose from "mongoose";
import Post from "../models/post.model.js";

/**
 * Create a new post
 * Route: POST /api/v1/posts/create
 */
export const createPost = async (req, res, next) => {
  try {
    const { name, description, age } = req.body;

    // Validation
    if (!name || !description || age === undefined || age === null) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, description, and age",
      });
    }

    const numericAge = Number(age);
    if (isNaN(numericAge) || numericAge < 0) {
      return res.status(400).json({
        success: false,
        message: "Age must be a valid non-negative number",
      });
    }

    const post = await Post.create({
      name: String(name).trim(),
      description: String(description).trim(),
      age: numericAge,
    });

    return res.status(201).json({
      success: true,
      message: "Post created successfully",
      data: post,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve all posts
 * Route: GET /api/v1/posts
 */
export const getAllPosts = async (req, res, next) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: posts.length,
      data: posts,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve a single post by ID
 * Route: GET /api/v1/posts/:id
 */
export const getPostById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post ID format",
      });
    }

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: post,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a post by ID
 * Route: PUT /api/v1/posts/:id
 */
export const updatePost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, age } = req.body;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post ID format",
      });
    }

    // Build update object
    const updateData = {};
    if (name !== undefined) updateData.name = String(name).trim();
    if (description !== undefined) updateData.description = String(description).trim();
    if (age !== undefined) {
      const numericAge = Number(age);
      if (isNaN(numericAge) || numericAge < 0) {
        return res.status(400).json({
          success: false,
          message: "Age must be a valid non-negative number",
        });
      }
      updateData.age = numericAge;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide at least one field to update (name, description, or age)",
      });
    }

    const updatedPost = await Post.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedPost) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Post updated successfully",
      data: updatedPost,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a post by ID
 * Route: DELETE /api/v1/posts/:id
 */
export const deletePost = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post ID format",
      });
    }

    const deletedPost = await Post.findByIdAndDelete(id);
    if (!deletedPost) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Post deleted successfully",
      data: {
        _id: id,
      },
    });
  } catch (error) {
    next(error);
  }
};
