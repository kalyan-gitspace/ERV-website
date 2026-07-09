import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { clientRepository } from '../repositories/client.repository.js';
import logger from '../config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsRoot = path.join(__dirname, '..', 'uploads', 'clients');

const ensureDirectory = (dirPath) => {
  fs.mkdirSync(dirPath, { recursive: true });
};

const buildFileName = (originalName) => {
  const parsed = path.parse(originalName || 'logo');
  const ext = parsed.ext ? parsed.ext.toLowerCase() : '.png';
  const base = (parsed.name || 'logo')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
  const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return `${base || 'logo'}-${uniqueSuffix}${ext}`;
};

const saveLogoFile = async (file) => {
  if (!file) return null;
  ensureDirectory(uploadsRoot);

  const fileName = buildFileName(file.originalname || 'logo');
  const finalPath = path.join(uploadsRoot, fileName);

  fs.writeFileSync(finalPath, file.buffer);
  return `/uploads/clients/${fileName}`;
};

export const clientService = {
  async getClients() {
    return await clientRepository.findAll();
  },

  async getClientById(id) {
    return await clientRepository.findById(id);
  },

  async createClient(data) {
    logger.info(`Creating client: ${data.name}`);
    const logoPath = await saveLogoFile(data.logoFile);
    return await clientRepository.create({
      name: data.name,
      logo: logoPath,
      website: data.website,
    });
  },

  async updateClient(id, data) {
    logger.info(`Updating client ID: ${id}`);
    const updateData = {
      name: data.name,
      website: data.website,
    };

    if (data.logoFile) {
      updateData.logo = await saveLogoFile(data.logoFile);
    }

    return await clientRepository.update(id, updateData);
  },

  async swapClientOrder(sourceId, targetId) {
    return await clientRepository.swapOrder(sourceId, targetId);
  },

  async deleteClient(id) {
    logger.info(`Deleting client ID: ${id}`);
    return await clientRepository.delete(id);
  }
};
