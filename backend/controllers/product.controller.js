import { productService } from '../services/product.service.js';
import { dashboardService } from '../services/dashboard.service.js';

export const productController = {
  /**
   * Get all products
   */
  async getAll(req, res, next) {
    try {
      const products = await productService.getAllProducts();
      return res.status(200).json(products);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get product by unique slug
   */
  async getBySlug(req, res, next) {
    try {
      const { slug } = req.params;
      const product = await productService.getProductBySlug(slug);
      
      if (!product) {
        return res.status(404).json({ message: `Product with slug '${slug}' not found.` });
      }
      
      return res.status(200).json(product);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get product by ID (Admin)
   */
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const product = await productService.getProductById(id);
      
      if (!product) {
        return res.status(404).json({ message: 'Product not found.' });
      }
      
      return res.status(200).json(product);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Create a new product (Admin)
   */
  async create(req, res, next) {
    try {
      const { galleryImageIds, ...productData } = req.body;

      if (!productData.name || !productData.slug || !productData.short_description || !productData.full_description) {
        return res.status(400).json({ message: 'Missing required fields: name, slug, short_description, full_description' });
      }

      const product = await productService.createProduct(productData, galleryImageIds);
      
      // Log admin activity
      await dashboardService.logAdminActivity(
        req.admin.sub, 
        'CREATE_PRODUCT', 
        { productId: product.id, name: product.name }, 
        req.ip
      );

      return res.status(201).json({
        message: 'Product created successfully.',
        product
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update an existing product (Admin)
   */
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const { galleryImageIds, ...productData } = req.body;

      const product = await productService.updateProduct(id, productData, galleryImageIds);
      
      if (!product) {
        return res.status(404).json({ message: 'Product not found or has been deleted.' });
      }

      // Log admin activity
      await dashboardService.logAdminActivity(
        req.admin.sub, 
        'UPDATE_PRODUCT', 
        { productId: id, name: product.name }, 
        req.ip
      );

      return res.status(200).json({
        message: 'Product updated successfully.',
        product
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete a product (Admin - Soft Delete)
   */
  async delete(req, res, next) {
    try {
      const { id } = req.params;
      const deleted = await productService.deleteProduct(id);
      
      if (!deleted) {
        return res.status(404).json({ message: 'Product not found or already deleted.' });
      }

      // Log admin activity
      await dashboardService.logAdminActivity(
        req.admin.sub, 
        'DELETE_PRODUCT', 
        { productId: id }, 
        req.ip
      );

      return res.status(200).json({ message: 'Product deleted successfully (soft delete).' });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Search products (Public & Admin)
   */
  async search(req, res, next) {
    try {
      const { q } = req.query;
      const results = await productService.searchProducts(q);
      return res.status(200).json(results);
    } catch (error) {
      next(error);
    }
  }
};
