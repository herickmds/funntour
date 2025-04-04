import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, hashPassword, comparePasswords } from "./auth";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { randomUUID } from "crypto";
import { 
  insertBoatSchema, 
  insertRouteSchema, 
  validationUserSchema, 
  userRoles, 
  insertBoatTypeSchema, 
  insertMarinaSchema,
  insertBookingSchema,
  bookingStatusOptions,
  insertArticleSchema,
  insertCountrySchema,
  insertStateSchema,
  insertCitySchema,
  insertPageSchema,
  insertItinerarySchema,
  insertPartnerPriceSchema
} from "@shared/schema";
import { ZodError } from "zod";

// Get dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage1 = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueFilename = `${randomUUID()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  },
});

const upload = multer({ 
  storage: storage1,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Formato de arquivo inválido. Apenas JPEG, PNG, WEBP e PDF são permitidos.'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  setupAuth(app);

  // User management routes
  app.get("/api/users", async (req, res) => {
    try {
      // Only admin users can list all users
      if (!req.isAuthenticated() || req.user?.role !== "admin") {
        return res.status(403).json({ error: "Acesso negado" });
      }

      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar usuários" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      // Only admin users or the user themselves can access user details
      if (!req.isAuthenticated() || (req.user?.id !== parseInt(req.params.id) && req.user?.role !== "admin")) {
        return res.status(403).json({ error: "Acesso negado" });
      }

      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }
      
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar usuário" });
    }
  });

  app.post("/api/users", upload.single('profileImage'), async (req, res) => {
    try {
      // Only admins can create users
      if (!req.isAuthenticated() || req.user?.role !== "admin") {
        return res.status(403).json({ error: "Acesso negado" });
      }

      // Check if profile image was uploaded
      if (!req.file) {
        return res.status(400).json({ error: "Foto de perfil é obrigatória" });
      }

      // Process form data
      const userData = { ...req.body };
      
      // Set photo URL
      userData.photoUrl = `/uploads/${req.file.filename}`;
      
      // Validate role
      if (!userRoles.includes(userData.role as any)) {
        return res.status(400).json({ error: "Perfil de usuário inválido" });
      }

      // Validate data first - we're using a simplified validation here instead of validationUserSchema
      // because we don't need all the refinements for server-side validation
      if (!userData.username || !userData.password || !userData.email || !userData.fullName ||
          !userData.document || !userData.documentType || !userData.birthDate) {
        return res.status(400).json({ error: "Campos obrigatórios não preenchidos" });
      }

      // Create user
      const newUser = await storage.createUser(userData);
      
      // Don't return password
      const { password, ...userWithoutPassword } = newUser;
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Dados inválidos", details: error.errors });
      }
      
      // Handle duplicate username or email
      if (error instanceof Error && error.message.includes("duplicate")) {
        if (error.message.includes("username")) {
          return res.status(400).json({ error: "Nome de usuário já existe" });
        }
        if (error.message.includes("email")) {
          return res.status(400).json({ error: "Email já cadastrado" });
        }
        if (error.message.includes("document")) {
          return res.status(400).json({ error: "CPF/CNPJ já cadastrado" });
        }
      }
      
      res.status(500).json({ error: "Erro ao criar usuário" });
    }
  });

  app.patch("/api/users/:id", upload.single('profileImage'), async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Only admin users or the user themselves can update user details
      if (!req.isAuthenticated() || (req.user?.id !== userId && req.user?.role !== "admin")) {
        return res.status(403).json({ error: "Acesso negado" });
      }

      // Get existing user
      const existingUser = await storage.getUser(userId);
      
      if (!existingUser) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }
      
      // Process form data
      const userData = { ...req.body };
      
      // Set photo URL if provided
      if (req.file) {
        userData.photoUrl = `/uploads/${req.file.filename}`;
      }
      
      // For non-admin users, prevent changing role
      if (req.user?.role !== "admin" && userData.role && userData.role !== existingUser.role) {
        return res.status(403).json({ error: "Não autorizado a mudar o perfil do usuário" });
      }
      
      // Validate role if provided
      if (userData.role && !userRoles.includes(userData.role as any)) {
        return res.status(400).json({ error: "Perfil de usuário inválido" });
      }

      // Update user - create only minimal updateable fields
      // We'll use a simple implementation for now
      const updatedUser = await storage.updateUser(userId, userData);
      
      if (!updatedUser) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }
      
      // Don't return password
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Dados inválidos", details: error.errors });
      }
      
      // Handle duplicate username or email
      if (error instanceof Error && error.message.includes("duplicate")) {
        if (error.message.includes("username")) {
          return res.status(400).json({ error: "Nome de usuário já existe" });
        }
        if (error.message.includes("email")) {
          return res.status(400).json({ error: "Email já cadastrado" });
        }
        if (error.message.includes("document")) {
          return res.status(400).json({ error: "CPF/CNPJ já cadastrado" });
        }
      }
      
      res.status(500).json({ error: "Erro ao atualizar usuário" });
    }
  });

  // Rota para alteração de senha
  app.post("/api/users/:id/change-password", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { currentPassword, newPassword } = req.body;
      
      // Verificar se o usuário está autenticado e se tem permissão
      if (!req.isAuthenticated() || (req.user?.id !== userId && req.user?.role !== "admin")) {
        return res.status(403).json({ error: "Acesso negado" });
      }
      
      // Obter o usuário para verificar a senha atual
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }
      
      // Verificar se a senha atual está correta
      const isPasswordValid = await comparePasswords(currentPassword, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({ error: "Senha atual incorreta" });
      }
      
      // Hash da nova senha e atualização
      const hashedPassword = await hashPassword(newPassword);
      const updatedUser = await storage.updateUserPassword(userId, hashedPassword);
      
      if (!updatedUser) {
        return res.status(404).json({ error: "Falha ao atualizar senha" });
      }
      
      res.json({ success: true, message: "Senha atualizada com sucesso" });
    } catch (error) {
      res.status(500).json({ error: "Erro ao atualizar senha" });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    try {
      // Only admin users can delete users
      if (!req.isAuthenticated() || req.user?.role !== "admin") {
        return res.status(403).json({ error: "Acesso negado" });
      }

      const userId = parseInt(req.params.id);
      
      // Prevent deleting your own account
      if (req.user?.id === userId) {
        return res.status(400).json({ error: "Não é possível excluir sua própria conta" });
      }
      
      const success = await storage.deleteUser(userId);
      
      if (!success) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Erro ao excluir usuário" });
    }
  });

  // Boat type routes
  app.get("/api/boat-types", async (req, res) => {
    try {
      const boatTypes = await storage.getAllBoatTypes();
      res.json(boatTypes);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar tipos de embarcação" });
    }
  });

  app.get("/api/boat-types/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const boatType = await storage.getBoatType(id);
      
      if (!boatType) {
        return res.status(404).json({ error: "Tipo de embarcação não encontrado" });
      }
      
      res.json(boatType);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar tipo de embarcação" });
    }
  });

  app.post("/api/boat-types", async (req, res) => {
    try {
      // Only admins can create boat types
      if (!req.isAuthenticated() || req.user?.role !== "admin") {
        return res.status(403).json({ error: "Acesso negado" });
      }

      const { name, description } = req.body;
      
      // Validation
      if (!name || name.trim() === "") {
        return res.status(400).json({ error: "Nome do tipo de embarcação é obrigatório" });
      }
      
      // Create boat type
      const newBoatType = await storage.createBoatType({ name, description });
      res.status(201).json(newBoatType);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("já existe")) {
          return res.status(400).json({ error: error.message });
        }
      }
      res.status(500).json({ error: "Erro ao criar tipo de embarcação" });
    }
  });

  app.put("/api/boat-types/:id", async (req, res) => {
    try {
      // Only admins can update boat types
      if (!req.isAuthenticated() || req.user?.role !== "admin") {
        return res.status(403).json({ error: "Acesso negado" });
      }

      const id = parseInt(req.params.id);
      const { name, description } = req.body;
      
      // Validation
      if (!name || name.trim() === "") {
        return res.status(400).json({ error: "Nome do tipo de embarcação é obrigatório" });
      }
      
      // Check if exists
      const existingType = await storage.getBoatType(id);
      if (!existingType) {
        return res.status(404).json({ error: "Tipo de embarcação não encontrado" });
      }
      
      // Update boat type
      const updatedType = await storage.updateBoatType(id, { name, description });
      res.json(updatedType);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("já existe")) {
          return res.status(400).json({ error: error.message });
        }
      }
      res.status(500).json({ error: "Erro ao atualizar tipo de embarcação" });
    }
  });

  app.delete("/api/boat-types/:id", async (req, res) => {
    try {
      // Only admins can delete boat types
      if (!req.isAuthenticated() || req.user?.role !== "admin") {
        return res.status(403).json({ error: "Acesso negado" });
      }

      const id = parseInt(req.params.id);
      
      // Check if exists
      const existingType = await storage.getBoatType(id);
      if (!existingType) {
        return res.status(404).json({ error: "Tipo de embarcação não encontrado" });
      }
      
      // Delete boat type
      await storage.deleteBoatType(id);
      res.status(204).send();
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("está sendo usado")) {
          return res.status(400).json({ error: error.message });
        }
      }
      res.status(500).json({ error: "Erro ao excluir tipo de embarcação" });
    }
  });

  // Boat routes
  app.get("/api/boats", async (req, res) => {
    try {
      const boats = await storage.getAllBoats();
      res.json(boats);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar embarcações" });
    }
  });

  app.get("/api/boats/:id", async (req, res) => {
    try {
      const boatId = parseInt(req.params.id);
      const boat = await storage.getBoat(boatId);
      
      if (!boat) {
        return res.status(404).json({ error: "Embarcação não encontrada" });
      }
      
      res.json(boat);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar embarcação" });
    }
  });

  app.post("/api/boats", upload.single('tieDocument'), async (req, res) => {
    try {
      // Check if TIE document was uploaded
      if (!req.file) {
        return res.status(400).json({ error: "Documento TIE é obrigatório" });
      }

      const boatData = JSON.parse(req.body.data);
      boatData.tieDocument = `/uploads/${req.file.filename}`;

      const validatedData = insertBoatSchema.parse(boatData);
      const newBoat = await storage.createBoat(validatedData);
      
      res.status(201).json(newBoat);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Dados inválidos", details: error.errors });
      }
      res.status(500).json({ error: "Erro ao criar embarcação" });
    }
  });

  app.put("/api/boats/:id", upload.single('tieDocument'), async (req, res) => {
    try {
      const boatId = parseInt(req.params.id);
      let boatData = JSON.parse(req.body.data);

      if (req.file) {
        boatData.tieDocument = `/uploads/${req.file.filename}`;
      }

      const validatedData = insertBoatSchema.parse(boatData);
      const updatedBoat = await storage.updateBoat(boatId, validatedData);
      
      if (!updatedBoat) {
        return res.status(404).json({ error: "Embarcação não encontrada" });
      }
      
      res.json(updatedBoat);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Dados inválidos", details: error.errors });
      }
      res.status(500).json({ error: "Erro ao atualizar embarcação" });
    }
  });

  app.delete("/api/boats/:id", async (req, res) => {
    try {
      const boatId = parseInt(req.params.id);
      const success = await storage.deleteBoat(boatId);
      
      if (!success) {
        return res.status(404).json({ error: "Embarcação não encontrada" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Erro ao excluir embarcação" });
    }
  });

  // Boat images routes
  app.post("/api/boats/:id/images", upload.array('images', 10), async (req, res) => {
    try {
      const boatId = parseInt(req.params.id);
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        return res.status(400).json({ error: "Nenhuma imagem enviada" });
      }
      
      const imageUrls = files.map(file => `/uploads/${file.filename}`);
      const images = await storage.addBoatImages(boatId, imageUrls);
      
      res.status(201).json(images);
    } catch (error) {
      res.status(500).json({ error: "Erro ao adicionar imagens" });
    }
  });

  app.get("/api/boats/:id/images", async (req, res) => {
    try {
      const boatId = parseInt(req.params.id);
      const images = await storage.getBoatImages(boatId);
      
      res.json(images);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar imagens" });
    }
  });

  app.delete("/api/boats/images/:id", async (req, res) => {
    try {
      const imageId = parseInt(req.params.id);
      const success = await storage.deleteBoatImage(imageId);
      
      if (!success) {
        return res.status(404).json({ error: "Imagem não encontrada" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Erro ao excluir imagem" });
    }
  });

  // Routes (itinerary) routes
  app.get("/api/routes", async (req, res) => {
    try {
      const routes = await storage.getAllRoutes();
      res.json(routes);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar roteiros" });
    }
  });
  
  // Boat-Route association routes
  app.get("/api/boats/:id/routes", async (req, res) => {
    try {
      const boatId = parseInt(req.params.id);
      const boatRoutes = await storage.getBoatRoutes(boatId);
      res.json(boatRoutes);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar roteiros da embarcação" });
    }
  });
  
  app.post("/api/boats/:id/routes", async (req, res) => {
    try {
      // Only admin users can add routes to boats
      if (!req.isAuthenticated() || req.user?.role !== "admin") {
        return res.status(403).json({ error: "Acesso negado" });
      }
      
      const boatId = parseInt(req.params.id);
      const { routeId, weekdayPrices, weekendPrices, holidayPrices } = req.body;
      
      // Validate the request body
      if (!routeId) {
        return res.status(400).json({ error: "ID do roteiro é obrigatório" });
      }
      
      if (!weekdayPrices || !weekendPrices || !holidayPrices) {
        return res.status(400).json({ error: "Preços para todos os períodos são obrigatórios" });
      }
      
      // Add the route to the boat
      const boatRoute = await storage.addRouteToBoat(
        boatId, 
        routeId, 
        weekdayPrices, 
        weekendPrices, 
        holidayPrices
      );
      
      res.status(201).json(boatRoute);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("já existe")) {
          return res.status(400).json({ error: error.message });
        }
        if (error.message.includes("não encontrada") || error.message.includes("não encontrado")) {
          return res.status(404).json({ error: error.message });
        }
      }
      
      res.status(500).json({ error: "Erro ao adicionar roteiro à embarcação" });
    }
  });
  
  app.delete("/api/boat-routes/:id", async (req, res) => {
    try {
      // Only admin users can remove routes from boats
      if (!req.isAuthenticated() || req.user?.role !== "admin") {
        return res.status(403).json({ error: "Acesso negado" });
      }
      
      const boatRouteId = parseInt(req.params.id);
      const success = await storage.removeRouteFromBoat(boatRouteId);
      
      if (!success) {
        return res.status(404).json({ error: "Associação não encontrada" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Erro ao remover roteiro da embarcação" });
    }
  });

  app.post("/api/routes", async (req, res) => {
    try {
      const validatedData = insertRouteSchema.parse(req.body);
      const newRoute = await storage.createRoute(validatedData);
      
      res.status(201).json(newRoute);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Dados inválidos", details: error.errors });
      }
      res.status(500).json({ error: "Erro ao criar roteiro" });
    }
  });
  
  // Marina routes
  app.get("/api/marinas", async (req, res) => {
    try {
      const marinas = await storage.getAllMarinas();
      res.json(marinas);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar marinas" });
    }
  });
  
  app.get("/api/marinas/:id", async (req, res) => {
    try {
      const marinaId = parseInt(req.params.id);
      const marina = await storage.getMarina(marinaId);
      
      if (!marina) {
        return res.status(404).json({ error: "Marina não encontrada" });
      }
      
      res.json(marina);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar marina" });
    }
  });
  
  app.post("/api/marinas", async (req, res) => {
    try {
      const validatedData = insertMarinaSchema.parse(req.body);
      const newMarina = await storage.createMarina(validatedData);
      
      res.status(201).json(newMarina);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Dados inválidos", details: error.errors });
      }
      res.status(500).json({ error: "Erro ao criar marina" });
    }
  });
  
  app.put("/api/marinas/:id", async (req, res) => {
    try {
      const marinaId = parseInt(req.params.id);
      const validatedData = insertMarinaSchema.parse(req.body);
      const updatedMarina = await storage.updateMarina(marinaId, validatedData);
      
      if (!updatedMarina) {
        return res.status(404).json({ error: "Marina não encontrada" });
      }
      
      res.json(updatedMarina);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Dados inválidos", details: error.errors });
      }
      res.status(500).json({ error: "Erro ao atualizar marina" });
    }
  });
  
  app.delete("/api/marinas/:id", async (req, res) => {
    try {
      const marinaId = parseInt(req.params.id);
      const success = await storage.deleteMarina(marinaId);
      
      if (!success) {
        return res.status(404).json({ error: "Marina não encontrada" });
      }
      
      res.status(204).send();
    } catch (error) {
      if (error instanceof Error && error.message.includes("embarcações existentes")) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: "Erro ao excluir marina" });
    }
  });

  // Booking routes
  app.get("/api/bookings", async (req, res) => {
    try {
      // Check if the user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Não autenticado" });
      }

      // Admin can see all bookings, clients can only see their own
      let bookings;
      if (req.user?.role === "admin" || req.user?.role === "parceiro") {
        bookings = await storage.getAllBookings();
      } else {
        bookings = await storage.getUserBookings(req.user?.id as number);
      }
      
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar reservas" });
    }
  });

  app.get("/api/bookings/:id", async (req, res) => {
    try {
      // Check if the user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Não autenticado" });
      }

      const bookingId = parseInt(req.params.id);
      const booking = await storage.getBooking(bookingId);
      
      if (!booking) {
        return res.status(404).json({ error: "Reserva não encontrada" });
      }
      
      // Only admin, partners or the user who made the booking can see it
      if (req.user?.role !== "admin" && req.user?.role !== "parceiro" && booking.userId !== req.user?.id) {
        return res.status(403).json({ error: "Acesso negado" });
      }
      
      res.json(booking);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar reserva" });
    }
  });

  app.get("/api/users/:id/bookings", async (req, res) => {
    try {
      // Check if the user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Não autenticado" });
      }

      const userId = parseInt(req.params.id);
      
      // Only admin, partners or the user themselves can see their bookings
      if (req.user?.role !== "admin" && req.user?.role !== "parceiro" && userId !== req.user?.id) {
        return res.status(403).json({ error: "Acesso negado" });
      }
      
      const bookings = await storage.getUserBookings(userId);
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar reservas do usuário" });
    }
  });

  app.post("/api/bookings", async (req, res) => {
    try {
      // Check if the user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Não autenticado" });
      }

      // Validate the booking data
      const bookingData = {
        ...req.body,
        status: req.body.status || "pending" // Default to pending if not provided
      };
      
      // Admins and partners can create bookings for any user
      // Clients can only create bookings for themselves
      if (req.user?.role !== "admin" && req.user?.role !== "parceiro" && 
          bookingData.userId && bookingData.userId !== req.user?.id) {
        return res.status(403).json({ error: "Não autorizado a criar reservas para outros usuários" });
      }
      
      // If no userId was provided, use the current user's ID
      if (!bookingData.userId) {
        bookingData.userId = req.user?.id;
      }
      
      // Validate data
      const validatedData = insertBookingSchema.parse(bookingData);
      
      // Create the booking
      const newBooking = await storage.createBooking(validatedData);
      res.status(201).json(newBooking);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Dados inválidos", details: error.errors });
      }
      
      if (error instanceof Error) {
        if (error.message.includes("not found")) {
          return res.status(400).json({ error: error.message });
        }
      }
      
      res.status(500).json({ error: "Erro ao criar reserva" });
    }
  });

  app.put("/api/bookings/:id", async (req, res) => {
    try {
      // Check if the user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Não autenticado" });
      }

      const bookingId = parseInt(req.params.id);
      const existingBooking = await storage.getBooking(bookingId);
      
      if (!existingBooking) {
        return res.status(404).json({ error: "Reserva não encontrada" });
      }
      
      // Only admin, partners, or the user who made the booking can update it
      if (req.user?.role !== "admin" && req.user?.role !== "parceiro" && existingBooking.userId !== req.user?.id) {
        return res.status(403).json({ error: "Acesso negado" });
      }
      
      // Additional restrictions for clients
      if (req.user?.role === "cliente") {
        // Clients can only update their own bookings and only if they're pending
        if (existingBooking.status !== "pending") {
          return res.status(403).json({ error: "Somente reservas pendentes podem ser editadas" });
        }
        
        // Clients can't change userId
        if (req.body.userId && req.body.userId !== existingBooking.userId) {
          return res.status(403).json({ error: "Não autorizado a alterar o usuário da reserva" });
        }
      }
      
      // Validate data
      const validatedData = insertBookingSchema.partial().parse(req.body);
      
      // Update the booking
      const updatedBooking = await storage.updateBooking(bookingId, validatedData);
      res.json(updatedBooking);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Dados inválidos", details: error.errors });
      }
      
      if (error instanceof Error) {
        if (error.message.includes("not found")) {
          return res.status(400).json({ error: error.message });
        }
      }
      
      res.status(500).json({ error: "Erro ao atualizar reserva" });
    }
  });

  app.patch("/api/bookings/:id/status", async (req, res) => {
    try {
      // Check if the user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Não autenticado" });
      }

      const bookingId = parseInt(req.params.id);
      const { status } = req.body;
      
      // Validate the status
      if (!status || !bookingStatusOptions.includes(status)) {
        return res.status(400).json({ error: "Status inválido" });
      }
      
      const existingBooking = await storage.getBooking(bookingId);
      
      if (!existingBooking) {
        return res.status(404).json({ error: "Reserva não encontrada" });
      }
      
      // Only admin and partners can change status, except for cancelling
      // Clients can only cancel their own pending bookings
      if (req.user?.role === "cliente") {
        if (existingBooking.userId !== req.user?.id) {
          return res.status(403).json({ error: "Acesso negado" });
        }
        
        if (status !== "cancelled") {
          return res.status(403).json({ error: "Clientes só podem cancelar reservas" });
        }
        
        if (existingBooking.status !== "pending") {
          return res.status(403).json({ error: "Somente reservas pendentes podem ser canceladas" });
        }
      }
      
      // Update the booking status
      const updatedBooking = await storage.updateBookingStatus(bookingId, status);
      res.json(updatedBooking);
    } catch (error) {
      res.status(500).json({ error: "Erro ao atualizar status da reserva" });
    }
  });

  app.delete("/api/bookings/:id", async (req, res) => {
    try {
      // Check if the user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Não autenticado" });
      }

      const bookingId = parseInt(req.params.id);
      const existingBooking = await storage.getBooking(bookingId);
      
      if (!existingBooking) {
        return res.status(404).json({ error: "Reserva não encontrada" });
      }
      
      // Only admins can delete any booking
      // Partners can delete bookings related to their boats
      // Clients can only delete their own pending bookings
      if (req.user?.role === "cliente") {
        if (existingBooking.userId !== req.user?.id) {
          return res.status(403).json({ error: "Acesso negado" });
        }
        
        if (existingBooking.status !== "pending") {
          return res.status(403).json({ error: "Somente reservas pendentes podem ser excluídas" });
        }
      } else if (req.user?.role === "parceiro") {
        // This would need additional logic to check if the boat belongs to the partner
        // For now, we'll assume partners can manage all bookings
      } else if (req.user?.role !== "admin") {
        return res.status(403).json({ error: "Acesso negado" });
      }
      
      const success = await storage.deleteBooking(bookingId);
      
      if (!success) {
        return res.status(404).json({ error: "Reserva não encontrada" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Erro ao excluir reserva" });
    }
  });

  // Password recovery routes
  app.post("/api/recover-password/request", async (req, res) => {
    try {
      const { document } = req.body;
      
      if (!document) {
        return res.status(400).json({ error: "CPF/CNPJ é obrigatório" });
      }
      
      // Find user by document
      const user = await storage.getUserByDocument(document);
      
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }
      
      // Generate recovery code
      const code = await storage.createRecoveryCode(user.id);
      
      // In a real environment, you would send an email or SMS with the code
      // We'll just return success to simulate it for the prototype
      // The code is logged to console only for development
      console.log(`Recovery code for user ${user.username} (${user.email}): ${code}`);
      
      res.json({ success: true, message: "Código de recuperação enviado" });
    } catch (error) {
      res.status(500).json({ error: "Erro ao processar solicitação de recuperação de senha" });
    }
  });
  
  app.post("/api/recover-password/verify", async (req, res) => {
    try {
      const { document, code } = req.body;
      
      if (!document || !code) {
        return res.status(400).json({ error: "CPF/CNPJ e código são obrigatórios" });
      }
      
      // Find user by document
      const user = await storage.getUserByDocument(document);
      
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }
      
      // Verify code
      const isValid = await storage.verifyRecoveryCode(user.id, code);
      
      if (!isValid) {
        return res.status(400).json({ error: "Código inválido ou expirado" });
      }
      
      res.json({ success: true, message: "Código verificado com sucesso" });
    } catch (error) {
      res.status(500).json({ error: "Erro ao verificar código de recuperação" });
    }
  });
  
  app.post("/api/recover-password/reset", async (req, res) => {
    try {
      const { document, code, password } = req.body;
      
      if (!document || !code || !password) {
        return res.status(400).json({ error: "CPF/CNPJ, código e nova senha são obrigatórios" });
      }
      
      // Find user by document
      const user = await storage.getUserByDocument(document);
      
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }
      
      // Verify code
      const isValid = await storage.verifyRecoveryCode(user.id, code);
      
      if (!isValid) {
        return res.status(400).json({ error: "Código inválido ou expirado" });
      }
      
      // Update password
      await storage.updateUserPassword(user.id, password);
      
      res.json({ success: true, message: "Senha alterada com sucesso" });
    } catch (error) {
      res.status(500).json({ error: "Erro ao redefinir senha" });
    }
  });

  // Articles routes
  // Public routes (no authentication required)
  app.get("/api/articles/public", async (req: Request, res: Response) => {
    try {
      const articles = await storage.getActiveArticles();
      res.json(articles);
    } catch (error) {
      console.error("Error fetching active articles:", error);
      res.status(500).json({ error: "Erro ao buscar artigos ativos" });
    }
  });
  
  app.get("/api/articles/public/:path", async (req: Request<{ path: string }>, res: Response) => {
    try {
      const path = req.params.path;
      const article = await storage.getArticleByPath(path);
      
      if (!article) {
        return res.status(404).json({ error: "Artigo não encontrado" });
      }
      
      // Check if the article is public (enabled, not draft, not deleted)
      if (!article.enabled || article.isDraft || article.isDeleted) {
        return res.status(404).json({ error: "Artigo não encontrado" });
      }
      
      res.json(article);
    } catch (error) {
      console.error("Error fetching article by path:", error);
      res.status(500).json({ error: "Erro ao buscar artigo" });
    }
  });
  
  // Admin routes (authentication required)
  app.get("/api/articles", async (req: Request, res: Response) => {
    try {
      // Only admins can access all articles
      if (!req.isAuthenticated() || req.user?.role !== "admin") {
        return res.status(403).json({ error: "Acesso negado" });
      }

      const articles = await storage.getAllArticles();
      res.json(articles);
    } catch (error) {
      console.error("Error fetching articles:", error);
      res.status(500).json({ error: "Erro ao buscar artigos" });
    }
  });
  
  app.get("/api/articles/:id", async (req: Request<{ id: string }>, res: Response) => {
    try {
      // Only admins can access any article
      if (!req.isAuthenticated() || req.user?.role !== "admin") {
        return res.status(403).json({ error: "Acesso negado" });
      }

      const id = parseInt(req.params.id);
      const article = await storage.getArticle(id);
      
      if (!article) {
        return res.status(404).json({ error: "Artigo não encontrado" });
      }
      
      res.json(article);
    } catch (error) {
      console.error("Error fetching article:", error);
      res.status(500).json({ error: "Erro ao buscar artigo" });
    }
  });
  
  app.post("/api/articles", upload.single('image'), async (req: Request, res: Response) => {
    try {
      // Only admins can create articles
      if (!req.isAuthenticated() || req.user?.role !== "admin") {
        return res.status(403).json({ error: "Acesso negado" });
      }

      let articleData = req.body;
      
      // Parse JSON fields if needed
      if (typeof articleData.paragraphs === 'string') {
        articleData.paragraphs = JSON.parse(articleData.paragraphs);
      }
      
      if (typeof articleData.tags === 'string') {
        articleData.tags = JSON.parse(articleData.tags);
      }
      
      // Add image URL if an image was uploaded
      if (req.file) {
        articleData.image = `/uploads/${req.file.filename}`;
      }
      
      const validatedData = insertArticleSchema.parse(articleData);
      const article = await storage.createArticle(validatedData);
      res.status(201).json(article);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Dados inválidos", details: error.errors });
      }
      console.error("Error creating article:", error);
      res.status(500).json({ error: "Erro ao criar artigo" });
    }
  });
  
  app.patch("/api/articles/:id", upload.single('image'), async (req: Request<{ id: string }>, res: Response) => {
    try {
      // Only admins can update articles
      if (!req.isAuthenticated() || req.user?.role !== "admin") {
        return res.status(403).json({ error: "Acesso negado" });
      }

      const id = parseInt(req.params.id);
      let articleData = req.body;
      
      // Parse JSON fields if needed
      if (typeof articleData.paragraphs === 'string') {
        articleData.paragraphs = JSON.parse(articleData.paragraphs);
      }
      
      if (typeof articleData.tags === 'string') {
        articleData.tags = JSON.parse(articleData.tags);
      }
      
      // Add image URL if an image was uploaded
      if (req.file) {
        articleData.image = `/uploads/${req.file.filename}`;
      }
      
      const updatedArticle = await storage.updateArticle(id, articleData);
      
      if (!updatedArticle) {
        return res.status(404).json({ error: "Artigo não encontrado" });
      }
      
      res.json(updatedArticle);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Dados inválidos", details: error.errors });
      }
      console.error("Error updating article:", error);
      res.status(500).json({ error: "Erro ao atualizar artigo" });
    }
  });
  
  app.patch("/api/articles/:id/status", async (req: Request<{ id: string }>, res: Response) => {
    try {
      // Only admins can update article status
      if (!req.isAuthenticated() || req.user?.role !== "admin") {
        return res.status(403).json({ error: "Acesso negado" });
      }

      const id = parseInt(req.params.id);
      const { field, value } = req.body;
      
      if (!['enabled', 'isDraft', 'isDeleted'].includes(field) || typeof value !== 'boolean') {
        return res.status(400).json({ error: "Parâmetros inválidos" });
      }
      
      const updatedArticle = await storage.toggleArticleStatus(id, field as 'enabled' | 'isDraft' | 'isDeleted', value);
      
      if (!updatedArticle) {
        return res.status(404).json({ error: "Artigo não encontrado" });
      }
      
      res.json(updatedArticle);
    } catch (error) {
      console.error("Error updating article status:", error);
      res.status(500).json({ error: "Erro ao atualizar status do artigo" });
    }
  });
  
  app.delete("/api/articles/:id", async (req: Request<{ id: string }>, res: Response) => {
    try {
      // Only admins can delete articles
      if (!req.isAuthenticated() || req.user?.role !== "admin") {
        return res.status(403).json({ error: "Acesso negado" });
      }

      const id = parseInt(req.params.id);
      const permanent = req.query.permanent === 'true';
      
      let deleted: boolean;
      
      if (permanent) {
        deleted = await storage.permanentlyDeleteArticle(id);
      } else {
        deleted = await storage.deleteArticle(id);
      }
      
      if (!deleted) {
        return res.status(404).json({ error: "Artigo não encontrado" });
      }
      
      res.sendStatus(204);
    } catch (error) {
      console.error("Error deleting article:", error);
      res.status(500).json({ error: "Erro ao excluir artigo" });
    }
  });
  
  // Serve uploaded files
  app.use("/uploads", (req: Request, res: Response, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Unauthorized");
    }
    next();
  }, express.static(uploadsDir));

  // Rotas para Países (Countries)
  app.get("/api/countries", async (req: Request, res: Response) => {
    try {
      const countries = await storage.getAllCountries();
      res.json(countries);
    } catch (error) {
      console.error("Error fetching countries:", error);
      res.status(500).json({ error: "Erro ao buscar países" });
    }
  });

  app.get("/api/countries/:id", async (req: Request<{ id: string }>, res: Response) => {
    try {
      const countryId = parseInt(req.params.id);
      const country = await storage.getCountry(countryId);
      
      if (!country) {
        return res.status(404).json({ error: "País não encontrado" });
      }
      
      res.json(country);
    } catch (error) {
      console.error("Error fetching country:", error);
      res.status(500).json({ error: "Erro ao buscar país" });
    }
  });

  app.post("/api/countries", async (req: Request, res: Response) => {
    try {
      // Only admins can create countries
      if (!req.isAuthenticated() || req.user?.role !== "admin") {
        return res.status(403).json({ error: "Acesso negado" });
      }

      const validatedData = insertCountrySchema.parse(req.body);
      const newCountry = await storage.createCountry(validatedData);
      
      res.status(201).json(newCountry);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Dados inválidos", details: error.errors });
      }
      
      if (error instanceof Error) {
        if (error.message.includes("já existe")) {
          return res.status(400).json({ error: error.message });
        }
      }
      
      res.status(500).json({ error: "Erro ao criar país" });
    }
  });

  app.patch("/api/countries/:id", async (req: Request<{ id: string }>, res: Response) => {
    try {
      // Only admins can update countries
      if (!req.isAuthenticated() || req.user?.role !== "admin") {
        return res.status(403).json({ error: "Acesso negado" });
      }

      const countryId = parseInt(req.params.id);
      const country = await storage.getCountry(countryId);
      
      if (!country) {
        return res.status(404).json({ error: "País não encontrado" });
      }
      
      const validatedData = insertCountrySchema.partial().parse(req.body);
      const updatedCountry = await storage.updateCountry(countryId, validatedData);
      
      res.json(updatedCountry);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Dados inválidos", details: error.errors });
      }
      
      if (error instanceof Error) {
        if (error.message.includes("já existe")) {
          return res.status(400).json({ error: error.message });
        }
      }
      
      res.status(500).json({ error: "Erro ao atualizar país" });
    }
  });

  app.delete("/api/countries/:id", async (req: Request<{ id: string }>, res: Response) => {
    try {
      // Only admins can delete countries
      if (!req.isAuthenticated() || req.user?.role !== "admin") {
        return res.status(403).json({ error: "Acesso negado" });
      }

      const countryId = parseInt(req.params.id);
      const country = await storage.getCountry(countryId);
      
      if (!country) {
        return res.status(404).json({ error: "País não encontrado" });
      }
      
      await storage.deleteCountry(countryId);
      res.status(204).send();
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("estados vinculados")) {
          return res.status(400).json({ error: error.message });
        }
      }
      
      res.status(500).json({ error: "Erro ao excluir país" });
    }
  });

  // Rotas para Estados (States)
  app.get("/api/states", async (req: Request, res: Response) => {
    try {
      const countryId = req.query.countryId ? parseInt(req.query.countryId as string) : undefined;
      
      let states;
      if (countryId) {
        states = await storage.getStatesByCountry(countryId);
      } else {
        states = await storage.getAllStates();
      }
      
      res.json(states);
    } catch (error) {
      console.error("Error fetching states:", error);
      res.status(500).json({ error: "Erro ao buscar estados" });
    }
  });

  app.get("/api/states/:id", async (req: Request<{ id: string }>, res: Response) => {
    try {
      const stateId = parseInt(req.params.id);
      const state = await storage.getState(stateId);
      
      if (!state) {
        return res.status(404).json({ error: "Estado não encontrado" });
      }
      
      res.json(state);
    } catch (error) {
      console.error("Error fetching state:", error);
      res.status(500).json({ error: "Erro ao buscar estado" });
    }
  });

  app.post("/api/states", async (req: Request, res: Response) => {
    try {
      // Only admins can create states
      if (!req.isAuthenticated() || req.user?.role !== "admin") {
        return res.status(403).json({ error: "Acesso negado" });
      }

      const validatedData = insertStateSchema.parse(req.body);
      const newState = await storage.createState(validatedData);
      
      res.status(201).json(newState);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Dados inválidos", details: error.errors });
      }
      
      if (error instanceof Error) {
        if (error.message.includes("já existe") || error.message.includes("não encontrado")) {
          return res.status(400).json({ error: error.message });
        }
      }
      
      res.status(500).json({ error: "Erro ao criar estado" });
    }
  });

  app.patch("/api/states/:id", async (req: Request<{ id: string }>, res: Response) => {
    try {
      // Only admins can update states
      if (!req.isAuthenticated() || req.user?.role !== "admin") {
        return res.status(403).json({ error: "Acesso negado" });
      }

      const stateId = parseInt(req.params.id);
      const state = await storage.getState(stateId);
      
      if (!state) {
        return res.status(404).json({ error: "Estado não encontrado" });
      }
      
      const validatedData = insertStateSchema.partial().parse(req.body);
      const updatedState = await storage.updateState(stateId, validatedData);
      
      res.json(updatedState);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Dados inválidos", details: error.errors });
      }
      
      if (error instanceof Error) {
        if (error.message.includes("já existe") || error.message.includes("não encontrado")) {
          return res.status(400).json({ error: error.message });
        }
      }
      
      res.status(500).json({ error: "Erro ao atualizar estado" });
    }
  });

  app.delete("/api/states/:id", async (req: Request<{ id: string }>, res: Response) => {
    try {
      // Only admins can delete states
      if (!req.isAuthenticated() || req.user?.role !== "admin") {
        return res.status(403).json({ error: "Acesso negado" });
      }

      const stateId = parseInt(req.params.id);
      const state = await storage.getState(stateId);
      
      if (!state) {
        return res.status(404).json({ error: "Estado não encontrado" });
      }
      
      await storage.deleteState(stateId);
      res.status(204).send();
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("cidades vinculadas")) {
          return res.status(400).json({ error: error.message });
        }
      }
      
      res.status(500).json({ error: "Erro ao excluir estado" });
    }
  });

  // Rotas para Cidades (Cities)
  app.get("/api/cities", async (req: Request, res: Response) => {
    try {
      const stateId = req.query.stateId ? parseInt(req.query.stateId as string) : undefined;
      
      let cities;
      if (stateId) {
        cities = await storage.getCitiesByState(stateId);
      } else {
        cities = await storage.getAllCities();
      }
      
      res.json(cities);
    } catch (error) {
      console.error("Error fetching cities:", error);
      res.status(500).json({ error: "Erro ao buscar cidades" });
    }
  });

  app.get("/api/cities/:id", async (req: Request<{ id: string }>, res: Response) => {
    try {
      const cityId = parseInt(req.params.id);
      const city = await storage.getCity(cityId);
      
      if (!city) {
        return res.status(404).json({ error: "Cidade não encontrada" });
      }
      
      res.json(city);
    } catch (error) {
      console.error("Error fetching city:", error);
      res.status(500).json({ error: "Erro ao buscar cidade" });
    }
  });

  app.post("/api/cities", async (req: Request, res: Response) => {
    try {
      // Only admins can create cities
      if (!req.isAuthenticated() || req.user?.role !== "admin") {
        return res.status(403).json({ error: "Acesso negado" });
      }

      const validatedData = insertCitySchema.parse(req.body);
      const newCity = await storage.createCity(validatedData);
      
      res.status(201).json(newCity);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Dados inválidos", details: error.errors });
      }
      
      if (error instanceof Error) {
        if (error.message.includes("já existe") || error.message.includes("não encontrado")) {
          return res.status(400).json({ error: error.message });
        }
      }
      
      res.status(500).json({ error: "Erro ao criar cidade" });
    }
  });

  app.patch("/api/cities/:id", async (req: Request<{ id: string }>, res: Response) => {
    try {
      // Only admins can update cities
      if (!req.isAuthenticated() || req.user?.role !== "admin") {
        return res.status(403).json({ error: "Acesso negado" });
      }

      const cityId = parseInt(req.params.id);
      const city = await storage.getCity(cityId);
      
      if (!city) {
        return res.status(404).json({ error: "Cidade não encontrada" });
      }
      
      const validatedData = insertCitySchema.partial().parse(req.body);
      const updatedCity = await storage.updateCity(cityId, validatedData);
      
      res.json(updatedCity);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Dados inválidos", details: error.errors });
      }
      
      if (error instanceof Error) {
        if (error.message.includes("já existe") || error.message.includes("não encontrado")) {
          return res.status(400).json({ error: error.message });
        }
      }
      
      res.status(500).json({ error: "Erro ao atualizar cidade" });
    }
  });

  app.delete("/api/cities/:id", async (req: Request<{ id: string }>, res: Response) => {
    try {
      // Only admins can delete cities
      if (!req.isAuthenticated() || req.user?.role !== "admin") {
        return res.status(403).json({ error: "Acesso negado" });
      }

      const cityId = parseInt(req.params.id);
      const city = await storage.getCity(cityId);
      
      if (!city) {
        return res.status(404).json({ error: "Cidade não encontrada" });
      }
      
      await storage.deleteCity(cityId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting city:", error);
      res.status(500).json({ error: "Erro ao excluir cidade" });
    }
  });

  // ===== Rotas para Gerenciamento de Páginas =====
  
  // Listar todas as páginas
  app.get("/api/pages", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated() || req.user?.role !== "admin") {
        return res.status(403).json({ error: "Acesso negado" });
      }

      const pages = await storage.getAllPages();
      res.json(pages);
    } catch (error) {
      console.error("Error fetching pages:", error);
      res.status(500).json({ error: "Erro ao buscar páginas" });
    }
  });

  // Obter uma página específica pelo ID
  app.get("/api/pages/:id", async (req: Request<{ id: string }>, res: Response) => {
    try {
      if (!req.isAuthenticated() || req.user?.role !== "admin") {
        return res.status(403).json({ error: "Acesso negado" });
      }

      const pageId = parseInt(req.params.id);
      const page = await storage.getPage(pageId);
      
      if (!page) {
        return res.status(404).json({ error: "Página não encontrada" });
      }
      
      res.json(page);
    } catch (error) {
      console.error("Error fetching page:", error);
      res.status(500).json({ error: "Erro ao buscar página" });
    }
  });

  // Obter uma página pelo slug (rota pública)
  app.get("/api/pages/public/:slug", async (req: Request<{ slug: string }>, res: Response) => {
    try {
      const slug = req.params.slug;
      const page = await storage.getPageBySlug(slug);
      
      if (!page) {
        return res.status(404).json({ error: "Página não encontrada" });
      }
      
      if (page.status !== "published") {
        return res.status(404).json({ error: "Página não encontrada" });
      }
      
      res.json(page);
    } catch (error) {
      console.error("Error fetching page by slug:", error);
      res.status(500).json({ error: "Erro ao buscar página" });
    }
  });

  // Criar uma nova página
  app.post("/api/pages", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated() || req.user?.role !== "admin") {
        return res.status(403).json({ error: "Acesso negado" });
      }

      const { title, slug } = req.body;
      
      // Verificar campos obrigatórios manualmente
      if (!title || !slug) {
        return res.status(400).json({ 
          error: "Dados inválidos", 
          details: [
            { path: ["title"], message: title ? "" : "O título é obrigatório" },
            { path: ["slug"], message: slug ? "" : "A URL é obrigatória" }
          ].filter(item => item.message)
        });
      }

      // Garantir campos mínimos para salvar corretamente
      const dataToSave = {
        title,
        slug,
        status: "draft" as const,
        description: null,
        content: null,
        canonicalUrl: null,
        imageUrl: null,
        imageAlt: null,
        metaTitle: null,
        metaDescription: null,
        createdBy: req.user.id,
        updatedBy: req.user.id
      };
      
      const newPage = await storage.createPage(dataToSave);
      res.status(201).json(newPage);
    } catch (error) {
      console.error("Error creating page:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Dados inválidos", details: error.errors });
      }
      
      if (error instanceof Error && error.message.includes("slug")) {
        return res.status(400).json({ error: "URL já existe. Escolha outro slug." });
      }
      
      res.status(500).json({ error: "Erro ao criar página" });
    }
  });

  // Atualizar uma página existente
  app.patch("/api/pages/:id", upload.single('image'), async (req: Request<{ id: string }>, res: Response) => {
    try {
      if (!req.isAuthenticated() || req.user?.role !== "admin") {
        return res.status(403).json({ error: "Acesso negado" });
      }

      const pageId = parseInt(req.params.id);
      const existingPage = await storage.getPage(pageId);
      
      if (!existingPage) {
        return res.status(404).json({ error: "Página não encontrada" });
      }
      
      const pageData = JSON.parse(req.body.data || '{}');
      
      // Adicionar URL da imagem se enviada
      if (req.file) {
        pageData.imageUrl = `/uploads/${req.file.filename}`;
      }

      // Atualizar a página
      const updatedPage = await storage.updatePage(pageId, {
        ...pageData,
        updatedBy: req.user.id
      });
      
      if (!updatedPage) {
        return res.status(404).json({ error: "Página não encontrada" });
      }
      
      res.json(updatedPage);
    } catch (error) {
      console.error("Error updating page:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Dados inválidos", details: error.errors });
      }
      
      if (error instanceof Error && error.message.includes("slug")) {
        return res.status(400).json({ error: "URL já existe. Escolha outro slug." });
      }
      
      res.status(500).json({ error: "Erro ao atualizar página" });
    }
  });

  // Atualizar o status de uma página (publicar, arquivar, rascunho)
  app.patch("/api/pages/:id/status", async (req: Request<{ id: string }>, res: Response) => {
    try {
      if (!req.isAuthenticated() || req.user?.role !== "admin") {
        return res.status(403).json({ error: "Acesso negado" });
      }

      const pageId = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!["draft", "published", "archived"].includes(status)) {
        return res.status(400).json({ error: "Status inválido" });
      }
      
      const updatedPage = await storage.updatePageStatus(pageId, status);
      
      if (!updatedPage) {
        return res.status(404).json({ error: "Página não encontrada" });
      }
      
      res.json(updatedPage);
    } catch (error) {
      console.error("Error updating page status:", error);
      res.status(500).json({ error: "Erro ao atualizar status da página" });
    }
  });

  // Excluir uma página
  app.delete("/api/pages/:id", async (req: Request<{ id: string }>, res: Response) => {
    try {
      if (!req.isAuthenticated() || req.user?.role !== "admin") {
        return res.status(403).json({ error: "Acesso negado" });
      }

      const pageId = parseInt(req.params.id);
      const success = await storage.deletePage(pageId);
      
      if (!success) {
        return res.status(404).json({ error: "Página não encontrada" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting page:", error);
      res.status(500).json({ error: "Erro ao excluir página" });
    }
  });
  
  // =========== Rotas para SEO de páginas ===========
  
  // Obter configurações SEO de uma página por pageId
  app.get("/api/pages/:pageId/seo", async (req: Request<{ pageId: string }>, res: Response) => {
    try {
      if (!req.isAuthenticated() || req.user?.role !== "admin") {
        return res.status(403).json({ error: "Acesso negado" });
      }
      
      const pageId = parseInt(req.params.pageId);
      const pageSeo = await storage.getPageSeoByPageId(pageId);
      
      if (!pageSeo) {
        return res.status(404).json({ error: "Configurações SEO não encontradas para esta página" });
      }
      
      res.status(200).json(pageSeo);
    } catch (error) {
      console.error("Error getting page SEO:", error);
      res.status(500).json({ error: "Erro ao obter configurações SEO" });
    }
  });
  
  // Criar/atualizar configurações SEO para uma página
  app.post("/api/pages/:pageId/seo", upload.single('image'), async (req: Request<{ pageId: string }>, res: Response) => {
    try {
      if (!req.isAuthenticated() || req.user?.role !== "admin") {
        return res.status(403).json({ error: "Acesso negado" });
      }
      
      const pageId = parseInt(req.params.pageId);
      const page = await storage.getPage(pageId);
      
      if (!page) {
        return res.status(404).json({ error: "Página não encontrada" });
      }
      
      let imageInfo = null;
      
      // Processa o upload de imagem para o og:image, se fornecido
      if (req.file) {
        const imageUrl = `/uploads/${req.file.filename}`;
        imageInfo = {
          url: imageUrl,
          secure_url: imageUrl,
          type: req.file.mimetype,
          width: req.body.image_width || null,
          height: req.body.image_height || null, 
          alt: req.body.image_alt || null
        };
      }
      
      // Obtem dados do formulário
      const seoData = JSON.parse(req.body.seoData || '{}');
      
      // Se temos uma nova imagem, atualizamos o objeto og
      if (imageInfo && seoData.og) {
        seoData.og.image = imageInfo;
      }
      
      // Adiciona o pageId aos dados SEO
      seoData.pageId = pageId;
      
      // Cria ou atualiza os dados de SEO
      const existingSeo = await storage.getPageSeoByPageId(pageId);
      let pageSeo;
      
      if (existingSeo) {
        pageSeo = await storage.updatePageSeo(existingSeo.id, seoData);
      } else {
        pageSeo = await storage.createPageSeo(seoData);
      }
      
      res.status(200).json(pageSeo);
    } catch (error) {
      console.error("Error saving page SEO:", error);
      res.status(500).json({ error: "Erro ao salvar configurações SEO" });
    }
  });
  
  // Excluir configurações SEO de uma página
  app.delete("/api/pages/:pageId/seo", async (req: Request<{ pageId: string }>, res: Response) => {
    try {
      if (!req.isAuthenticated() || req.user?.role !== "admin") {
        return res.status(403).json({ error: "Acesso negado" });
      }
      
      const pageId = parseInt(req.params.pageId);
      const pageSeo = await storage.getPageSeoByPageId(pageId);
      
      if (!pageSeo) {
        return res.status(404).json({ error: "Configurações SEO não encontradas para esta página" });
      }
      
      const success = await storage.deletePageSeo(pageSeo.id);
      
      if (success) {
        res.status(200).json({ message: "Configurações SEO excluídas com sucesso" });
      } else {
        res.status(500).json({ error: "Erro ao excluir configurações SEO" });
      }
    } catch (error) {
      console.error("Error deleting page SEO:", error);
      res.status(500).json({ error: "Erro ao excluir configurações SEO" });
    }
  });

  // Endpoints para Roteiros (Itineraries)
  
  // Listar todos os roteiros
  app.get("/api/itineraries", async (req, res) => {
    try {
      const itineraries = await storage.getAllItineraries();
      res.json(itineraries);
    } catch (error) {
      console.error("Error fetching itineraries:", error);
      res.status(500).json({ error: "Erro ao buscar roteiros" });
    }
  });

  // Obter um roteiro específico pelo ID
  app.get("/api/itineraries/:id", async (req: Request<{ id: string }>, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const itinerary = await storage.getItinerary(id);
      
      if (!itinerary) {
        return res.status(404).json({ error: "Roteiro não encontrado" });
      }
      
      res.json(itinerary);
    } catch (error) {
      console.error("Error fetching itinerary:", error);
      res.status(500).json({ error: "Erro ao buscar roteiro" });
    }
  });

  // Listar roteiros de um parceiro específico
  app.get("/api/partners/:partnerId/itineraries", async (req: Request<{ partnerId: string }>, res: Response) => {
    try {
      const partnerId = parseInt(req.params.partnerId);
      const itineraries = await storage.getItinerariesByPartner(partnerId);
      res.json(itineraries);
    } catch (error) {
      console.error("Error fetching partner itineraries:", error);
      res.status(500).json({ error: "Erro ao buscar roteiros do parceiro" });
    }
  });

  // Criar um novo roteiro
  app.post("/api/itineraries", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      // Apenas admins e parceiros podem criar roteiros
      if (req.user?.role !== "admin" && req.user?.role !== "parceiro") {
        return res.status(403).json({ error: "Acesso negado" });
      }

      const itineraryData = req.body;
      
      // Se for um parceiro, só pode criar roteiros para si mesmo
      if (req.user?.role === "parceiro") {
        itineraryData.partnerId = req.user.id;
      }

      // Validar dados
      const validatedData = insertItinerarySchema.parse(itineraryData);
      const newItinerary = await storage.createItinerary(validatedData);
      
      res.status(201).json(newItinerary);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Dados inválidos", details: error.errors });
      }
      
      if (error instanceof Error) {
        if (error.message.includes("not found") || error.message.includes("is not a partner")) {
          return res.status(400).json({ error: error.message });
        }
      }
      
      console.error("Error creating itinerary:", error);
      res.status(500).json({ error: "Erro ao criar roteiro" });
    }
  });

  // Atualizar um roteiro existente
  app.put("/api/itineraries/:id", async (req: Request<{ id: string }>, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }
      
      const id = parseInt(req.params.id);
      const existingItinerary = await storage.getItinerary(id);
      
      if (!existingItinerary) {
        return res.status(404).json({ error: "Roteiro não encontrado" });
      }
      
      // Verificar permissões: apenas admin pode editar qualquer roteiro
      // Parceiros só podem editar seus próprios roteiros
      if (req.user?.role !== "admin" && 
          (req.user?.role !== "parceiro" || existingItinerary.partnerId !== req.user?.id)) {
        return res.status(403).json({ error: "Acesso negado" });
      }
      
      const itineraryData = req.body;
      
      // Se for um parceiro, não pode mudar o partnerId
      if (req.user?.role === "parceiro") {
        if (itineraryData.partnerId && itineraryData.partnerId !== req.user.id) {
          return res.status(403).json({ error: "Não é permitido alterar o proprietário do roteiro" });
        }
        itineraryData.partnerId = req.user.id;
      }
      
      // Validar dados
      const validatedData = insertItinerarySchema.parse(itineraryData);
      const updatedItinerary = await storage.updateItinerary(id, validatedData);
      
      res.json(updatedItinerary);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Dados inválidos", details: error.errors });
      }
      
      if (error instanceof Error) {
        if (error.message.includes("not found") || error.message.includes("is not a partner")) {
          return res.status(400).json({ error: error.message });
        }
      }
      
      console.error("Error updating itinerary:", error);
      res.status(500).json({ error: "Erro ao atualizar roteiro" });
    }
  });

  // Excluir um roteiro
  app.delete("/api/itineraries/:id", async (req: Request<{ id: string }>, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }
      
      const id = parseInt(req.params.id);
      const existingItinerary = await storage.getItinerary(id);
      
      if (!existingItinerary) {
        return res.status(404).json({ error: "Roteiro não encontrado" });
      }
      
      // Verificar permissões: apenas admin pode excluir qualquer roteiro
      // Parceiros só podem excluir seus próprios roteiros
      if (req.user?.role !== "admin" && 
          (req.user?.role !== "parceiro" || existingItinerary.partnerId !== req.user?.id)) {
        return res.status(403).json({ error: "Acesso negado" });
      }
      
      const success = await storage.deleteItinerary(id);
      
      if (success) {
        res.status(204).send();
      } else {
        res.status(500).json({ error: "Erro ao excluir roteiro" });
      }
    } catch (error) {
      console.error("Error deleting itinerary:", error);
      res.status(500).json({ error: "Erro ao excluir roteiro" });
    }
  });

  // Endpoints para Preços Parceiro (Partner Prices)
  
  // Listar todos os preços de parceiros
  app.get("/api/partner-prices", async (req, res) => {
    try {
      // Apenas admin pode ver todos os preços
      if (!req.isAuthenticated() || req.user?.role !== "admin") {
        return res.status(403).json({ error: "Acesso negado" });
      }
      
      const prices = await storage.getAllPartnerPrices();
      res.json(prices);
    } catch (error) {
      console.error("Error fetching partner prices:", error);
      res.status(500).json({ error: "Erro ao buscar preços de parceiros" });
    }
  });

  // Obter um preço específico pelo ID
  app.get("/api/partner-prices/:id", async (req: Request<{ id: string }>, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }
      
      const id = parseInt(req.params.id);
      const price = await storage.getPartnerPrice(id);
      
      if (!price) {
        return res.status(404).json({ error: "Preço não encontrado" });
      }
      
      // Verificar permissões: apenas admin pode ver qualquer preço
      // Parceiros só podem ver seus próprios preços
      if (req.user?.role !== "admin" && 
          (req.user?.role !== "parceiro" || price.partnerId !== req.user?.id)) {
        return res.status(403).json({ error: "Acesso negado" });
      }
      
      res.json(price);
    } catch (error) {
      console.error("Error fetching partner price:", error);
      res.status(500).json({ error: "Erro ao buscar preço de parceiro" });
    }
  });

  // Listar preços de um parceiro específico
  app.get("/api/partners/:partnerId/prices", async (req: Request<{ partnerId: string }>, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }
      
      const partnerId = parseInt(req.params.partnerId);
      
      // Verificar permissões: apenas admin pode ver preços de qualquer parceiro
      // Parceiros só podem ver seus próprios preços
      if (req.user?.role !== "admin" && 
          (req.user?.role !== "parceiro" || partnerId !== req.user?.id)) {
        return res.status(403).json({ error: "Acesso negado" });
      }
      
      const prices = await storage.getPartnerPricesByPartner(partnerId);
      res.json(prices);
    } catch (error) {
      console.error("Error fetching partner prices:", error);
      res.status(500).json({ error: "Erro ao buscar preços do parceiro" });
    }
  });

  // Listar preços de uma embarcação específica
  app.get("/api/boats/:boatId/partner-prices", async (req: Request<{ boatId: string }>, res: Response) => {
    try {
      if (!req.isAuthenticated() || req.user?.role !== "admin") {
        return res.status(403).json({ error: "Acesso negado" });
      }
      
      const boatId = parseInt(req.params.boatId);
      const prices = await storage.getPartnerPricesByBoat(boatId);
      res.json(prices);
    } catch (error) {
      console.error("Error fetching boat partner prices:", error);
      res.status(500).json({ error: "Erro ao buscar preços de parceiros para esta embarcação" });
    }
  });

  // Criar um novo preço de parceiro
  app.post("/api/partner-prices", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }
      
      // Apenas admins e parceiros podem criar preços
      if (req.user?.role !== "admin" && req.user?.role !== "parceiro") {
        return res.status(403).json({ error: "Acesso negado" });
      }
      
      const priceData = req.body;
      
      // Se for um parceiro, só pode criar preços para si mesmo
      if (req.user?.role === "parceiro") {
        priceData.partnerId = req.user.id;
      }
      
      // Validar dados
      const validatedData = insertPartnerPriceSchema.parse(priceData);
      const newPrice = await storage.createPartnerPrice(validatedData);
      
      res.status(201).json(newPrice);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Dados inválidos", details: error.errors });
      }
      
      if (error instanceof Error) {
        if (error.message.includes("not found") || 
            error.message.includes("is not a partner") ||
            error.message.includes("already set")) {
          return res.status(400).json({ error: error.message });
        }
      }
      
      console.error("Error creating partner price:", error);
      res.status(500).json({ error: "Erro ao criar preço de parceiro" });
    }
  });

  // Atualizar um preço de parceiro existente
  app.put("/api/partner-prices/:id", async (req: Request<{ id: string }>, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }
      
      const id = parseInt(req.params.id);
      const existingPrice = await storage.getPartnerPrice(id);
      
      if (!existingPrice) {
        return res.status(404).json({ error: "Preço não encontrado" });
      }
      
      // Verificar permissões: apenas admin pode editar qualquer preço
      // Parceiros só podem editar seus próprios preços
      if (req.user?.role !== "admin" && 
          (req.user?.role !== "parceiro" || existingPrice.partnerId !== req.user?.id)) {
        return res.status(403).json({ error: "Acesso negado" });
      }
      
      const priceData = req.body;
      
      // Se for um parceiro, não pode mudar o partnerId ou o boatId
      if (req.user?.role === "parceiro") {
        if (priceData.partnerId && priceData.partnerId !== req.user.id) {
          return res.status(403).json({ error: "Não é permitido alterar o proprietário do preço" });
        }
        priceData.partnerId = req.user.id;
        
        if (priceData.boatId && priceData.boatId !== existingPrice.boatId) {
          return res.status(403).json({ error: "Não é permitido alterar a embarcação associada" });
        }
      }
      
      // Validar dados
      const validatedData = insertPartnerPriceSchema.parse(priceData);
      const updatedPrice = await storage.updatePartnerPrice(id, validatedData);
      
      res.json(updatedPrice);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Dados inválidos", details: error.errors });
      }
      
      if (error instanceof Error) {
        if (error.message.includes("not found") || 
            error.message.includes("is not a partner") ||
            error.message.includes("already set")) {
          return res.status(400).json({ error: error.message });
        }
      }
      
      console.error("Error updating partner price:", error);
      res.status(500).json({ error: "Erro ao atualizar preço de parceiro" });
    }
  });

  // Excluir um preço de parceiro
  app.delete("/api/partner-prices/:id", async (req: Request<{ id: string }>, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }
      
      const id = parseInt(req.params.id);
      const existingPrice = await storage.getPartnerPrice(id);
      
      if (!existingPrice) {
        return res.status(404).json({ error: "Preço não encontrado" });
      }
      
      // Verificar permissões: apenas admin pode excluir qualquer preço
      // Parceiros só podem excluir seus próprios preços
      if (req.user?.role !== "admin" && 
          (req.user?.role !== "parceiro" || existingPrice.partnerId !== req.user?.id)) {
        return res.status(403).json({ error: "Acesso negado" });
      }
      
      const success = await storage.deletePartnerPrice(id);
      
      if (success) {
        res.status(204).send();
      } else {
        res.status(500).json({ error: "Erro ao excluir preço de parceiro" });
      }
    } catch (error) {
      console.error("Error deleting partner price:", error);
      res.status(500).json({ error: "Erro ao excluir preço de parceiro" });
    }
  });

  // Rota para obter todos os parceiros (usuários com role="parceiro")
  app.get("/api/partners", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }
      
      const partners = await storage.getPartnerUsers();
      
      // Não retornar as senhas
      const partnersWithoutPasswords = partners.map(partner => {
        const { password, ...partnerWithoutPassword } = partner;
        return partnerWithoutPassword;
      });
      
      res.json(partnersWithoutPasswords);
    } catch (error) {
      console.error("Error fetching partners:", error);
      res.status(500).json({ error: "Erro ao buscar parceiros" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
