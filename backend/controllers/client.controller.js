import { clientService } from '../services/client.service.js';
import { dashboardService } from '../services/dashboard.service.js';

export const clientController = {
  async getAll(req, res, next) {
    try {
      const clients = await clientService.getClients();
      return res.status(200).json(clients);
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const { name, website } = req.body;

      if (!name) {
        return res.status(400).json({ message: 'Client name is required.' });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'Logo upload is required.' });
      }

      const client = await clientService.createClient({
        name: name.trim(),
        website: website?.trim() || null,
        logoFile: req.file,
      });

      await dashboardService.logAdminActivity(
        req.admin.sub,
        'CREATE_CLIENT',
        { clientId: client.id, name: client.name },
        req.ip
      );

      return res.status(201).json({
        message: 'Client created successfully.',
        client
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const { name, website } = req.body;

      if (!name) {
        return res.status(400).json({ message: 'Client name is required.' });
      }

      const client = await clientService.updateClient(id, {
        name: name.trim(),
        website: website?.trim() || null,
        logoFile: req.file,
      });

      if (!client) {
        return res.status(404).json({ message: 'Client not found.' });
      }

      await dashboardService.logAdminActivity(
        req.admin.sub,
        'UPDATE_CLIENT',
        { clientId: client.id, name: client.name },
        req.ip
      );

      return res.status(200).json({
        message: 'Client updated successfully.',
        client
      });
    } catch (error) {
      next(error);
    }
  },

  async swapOrder(req, res, next) {
    try {
      const { id } = req.params;
      const { swapWithId } = req.body;

      if (!swapWithId) {
        return res.status(400).json({ message: 'swapWithId is required.' });
      }

      const swapped = await clientService.swapClientOrder(id, swapWithId);
      if (!swapped) {
        return res.status(404).json({ message: 'Unable to swap client order.' });
      }

      await dashboardService.logAdminActivity(
        req.admin.sub,
        'SWAP_CLIENT_ORDER',
        { sourceId: id, targetId: swapWithId },
        req.ip
      );

      return res.status(200).json({
        message: 'Client order updated successfully.',
        data: swapped
      });
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      const deleted = await clientService.deleteClient(id);
      if (!deleted) {
        return res.status(404).json({ message: 'Client not found.' });
      }

      await dashboardService.logAdminActivity(
        req.admin.sub,
        'DELETE_CLIENT',
        { clientId: id },
        req.ip
      );

      return res.status(200).json({ message: 'Client deleted successfully.' });
    } catch (error) {
      next(error);
    }
  }
};
