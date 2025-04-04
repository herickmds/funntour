import { 
  InsertUser, 
  User, 
  Boat, 
  InsertBoat, 
  BoatImage, 
  InsertBoatImage, 
  Route, 
  InsertRoute, 
  BoatRoute, 
  Prices,
  BoatType,
  InsertBoatType,
  Marina,
  InsertMarina,
  Booking,
  InsertBooking,
  BookingStatus,
  Article,
  InsertArticle,
  Country,
  InsertCountry,
  State, 
  InsertState,
  City,
  InsertCity,
  Page,
  InsertPage,
  PageSeo,
  Itinerary,
  InsertItinerary,
  PartnerPrice,
  InsertPartnerPrice
} from "@shared/schema";
import session from "express-session";
import { hashPassword } from "./auth";
import createMemoryStore from "memorystore";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { promisify } from "util";

// Get dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create memory store for sessions
const MemoryStore = createMemoryStore(session);

// Interface defining storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByDocument(document: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  updateUserPassword(userId: number, newPassword: string): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  getAllUsers(): Promise<User[]>;
  getPartnerUsers(): Promise<User[]>; // Para listar apenas usuários parceiros
  
  // Password recovery operations
  createRecoveryCode(userId: number): Promise<string>;
  verifyRecoveryCode(userId: number, code: string): Promise<boolean>;

  // Boat operations
  getAllBoats(): Promise<Boat[]>;
  getBoat(id: number): Promise<Boat | undefined>;
  createBoat(boat: InsertBoat): Promise<Boat>;
  updateBoat(id: number, boat: InsertBoat): Promise<Boat | undefined>;
  deleteBoat(id: number): Promise<boolean>;

  // Boat Type operations
  getAllBoatTypes(): Promise<BoatType[]>;
  getBoatType(id: number): Promise<BoatType | undefined>;
  createBoatType(boatType: InsertBoatType): Promise<BoatType>;
  updateBoatType(id: number, boatType: Partial<InsertBoatType>): Promise<BoatType | undefined>;
  deleteBoatType(id: number): Promise<boolean>;

  // Boat image operations
  getBoatImages(boatId: number): Promise<BoatImage[]>;
  addBoatImages(boatId: number, imageUrls: string[]): Promise<BoatImage[]>;
  deleteBoatImage(imageId: number): Promise<boolean>;

  // Route operations
  getAllRoutes(): Promise<Route[]>;
  getRoute(id: number): Promise<Route | undefined>;
  createRoute(route: InsertRoute): Promise<Route>;

  // Boat-Route operations
  getBoatRoutes(boatId: number): Promise<(BoatRoute & { route: Route })[]>;
  addRouteToBoat(
    boatId: number,
    routeId: number,
    weekdayPrices: Prices,
    weekendPrices: Prices,
    holidayPrices: Prices
  ): Promise<BoatRoute>;
  removeRouteFromBoat(boatRouteId: number): Promise<boolean>;

  // Marina operations
  getAllMarinas(): Promise<Marina[]>;
  getMarina(id: number): Promise<Marina | undefined>;
  createMarina(marina: InsertMarina): Promise<Marina>;
  updateMarina(id: number, marina: Partial<InsertMarina>): Promise<Marina | undefined>;
  deleteMarina(id: number): Promise<boolean>;

  // Booking operations
  getAllBookings(): Promise<Booking[]>;
  getBooking(id: number): Promise<Booking | undefined>;
  getUserBookings(userId: number): Promise<Booking[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBooking(id: number, booking: Partial<InsertBooking>): Promise<Booking | undefined>;
  updateBookingStatus(id: number, status: BookingStatus): Promise<Booking | undefined>;
  deleteBooking(id: number): Promise<boolean>;
  
  // Article operations
  getAllArticles(): Promise<Article[]>;
  getActiveArticles(): Promise<Article[]>;
  getArticle(id: number): Promise<Article | undefined>;
  getArticleByPath(path: string): Promise<Article | undefined>;
  createArticle(article: InsertArticle): Promise<Article>;
  updateArticle(id: number, article: Partial<InsertArticle>): Promise<Article | undefined>;
  toggleArticleStatus(id: number, field: 'enabled' | 'isDraft' | 'isDeleted', value: boolean): Promise<Article | undefined>;
  deleteArticle(id: number): Promise<boolean>; // Soft delete (move to trash)
  permanentlyDeleteArticle(id: number): Promise<boolean>; // Hard delete (from trash)

  // Country operations
  getAllCountries(): Promise<Country[]>;
  getCountry(id: number): Promise<Country | undefined>;
  getCountryByName(name: string): Promise<Country | undefined>;
  getCountryByCode(code: string): Promise<Country | undefined>;
  createCountry(country: InsertCountry): Promise<Country>;
  updateCountry(id: number, country: Partial<InsertCountry>): Promise<Country | undefined>;
  deleteCountry(id: number): Promise<boolean>;

  // State operations
  getAllStates(): Promise<State[]>;
  getState(id: number): Promise<State | undefined>;
  getStateByNameAndCountry(name: string, countryId: number): Promise<State | undefined>;
  getStateByCodeAndCountry(code: string, countryId: number): Promise<State | undefined>;
  getStatesByCountry(countryId: number): Promise<State[]>;
  createState(state: InsertState): Promise<State>;
  updateState(id: number, state: Partial<InsertState>): Promise<State | undefined>;
  deleteState(id: number): Promise<boolean>;

  // City operations
  getAllCities(): Promise<City[]>;
  getCity(id: number): Promise<City | undefined>;
  getCityByNameAndState(name: string, stateId: number): Promise<City | undefined>;
  getCitiesByState(stateId: number): Promise<City[]>;
  createCity(city: InsertCity): Promise<City>;
  updateCity(id: number, city: Partial<InsertCity>): Promise<City | undefined>;
  deleteCity(id: number): Promise<boolean>;

  // Page operations
  getAllPages(): Promise<Page[]>;
  getPublishedPages(): Promise<Page[]>;
  getPage(id: number): Promise<Page | undefined>;
  getPageBySlug(slug: string): Promise<Page | undefined>;
  createPage(page: InsertPage): Promise<Page>;
  updatePage(id: number, page: Partial<InsertPage>): Promise<Page | undefined>;
  updatePageStatus(id: number, status: string): Promise<Page | undefined>;
  deletePage(id: number): Promise<boolean>;
  
  // Page SEO operations
  getPageSeo(id: number): Promise<PageSeo | undefined>;
  getPageSeoByPageId(pageId: number): Promise<PageSeo | undefined>;
  createPageSeo(pageSeo: PageSeo): Promise<PageSeo>;
  updatePageSeo(id: number, pageSeo: Partial<PageSeo>): Promise<PageSeo | undefined>;
  deletePageSeo(id: number): Promise<boolean>;

  // Itinerary operations (Roteiros)
  getAllItineraries(): Promise<Itinerary[]>;
  getItinerary(id: number): Promise<Itinerary | undefined>;
  getItinerariesByPartner(partnerId: number): Promise<Itinerary[]>;
  createItinerary(itinerary: InsertItinerary): Promise<Itinerary>;
  updateItinerary(id: number, itinerary: Partial<InsertItinerary>): Promise<Itinerary | undefined>;
  deleteItinerary(id: number): Promise<boolean>;

  // Partner Prices operations (Preços Parceiro)
  getAllPartnerPrices(): Promise<PartnerPrice[]>;
  getPartnerPrice(id: number): Promise<PartnerPrice | undefined>;
  getPartnerPricesByPartner(partnerId: number): Promise<PartnerPrice[]>;
  getPartnerPricesByBoat(boatId: number): Promise<PartnerPrice[]>;
  getPartnerPriceByPartnerAndBoat(partnerId: number, boatId: number): Promise<PartnerPrice | undefined>;
  createPartnerPrice(partnerPrice: InsertPartnerPrice): Promise<PartnerPrice>;
  updatePartnerPrice(id: number, partnerPrice: Partial<InsertPartnerPrice>): Promise<PartnerPrice | undefined>;
  deletePartnerPrice(id: number): Promise<boolean>;

  // Session store
  sessionStore: session.Store;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private boats: Map<number, Boat>;
  private boatTypes: Map<number, BoatType>;
  private boatImages: Map<number, BoatImage>;
  private routes: Map<number, Route>;
  private boatRoutes: Map<number, BoatRoute>;
  private marinas: Map<number, Marina>;
  private bookings: Map<number, Booking>;
  private articles: Map<number, Article>;
  private recoveryCodes: Map<number, { code: string, expiresAt: number }>;
  private countries: Map<number, Country>;
  private states: Map<number, State>;
  private cities: Map<number, City>;
  private pages: Map<number, Page>;
  private pageSeos: Map<number, PageSeo>;
  private itineraries: Map<number, Itinerary>;
  private partnerPrices: Map<number, PartnerPrice>;
  
  sessionStore: session.Store;
  
  private userIdCounter: number;
  private boatIdCounter: number;
  private boatTypeIdCounter: number;
  private imageIdCounter: number;
  private routeIdCounter: number;
  private boatRouteIdCounter: number;
  private marinaIdCounter: number;
  private bookingIdCounter: number;
  private articleIdCounter: number;
  private countryIdCounter: number;
  private stateIdCounter: number;
  private cityIdCounter: number;
  private pageIdCounter: number;
  private pageSeoIdCounter: number;
  private itineraryIdCounter: number;
  private partnerPriceIdCounter: number;

  constructor() {
    this.users = new Map();
    this.boats = new Map();
    this.boatTypes = new Map();
    this.boatImages = new Map();
    this.routes = new Map();
    this.boatRoutes = new Map();
    this.marinas = new Map();
    this.bookings = new Map();
    this.articles = new Map();
    this.recoveryCodes = new Map();
    this.countries = new Map();
    this.states = new Map();
    this.cities = new Map();
    this.pages = new Map();
    this.pageSeos = new Map();
    this.itineraries = new Map();
    this.partnerPrices = new Map();
    
    this.userIdCounter = 1;
    this.boatIdCounter = 1;
    this.boatTypeIdCounter = 1;
    this.imageIdCounter = 1;
    this.routeIdCounter = 1;
    this.boatRouteIdCounter = 1;
    this.marinaIdCounter = 1;
    this.bookingIdCounter = 1;
    this.articleIdCounter = 1;
    this.countryIdCounter = 1;
    this.stateIdCounter = 1;
    this.cityIdCounter = 1;
    this.pageIdCounter = 1;
    this.pageSeoIdCounter = 1;
    this.itineraryIdCounter = 1;
    this.partnerPriceIdCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 hours
    });
    
    // Create default admin user
    this.createDefaultAdmin();
    
    // Initialize with sample routes
    this.initializeRoutes();
    
    // Initialize default boat types
    this.initializeBoatTypes();
  }
  
  private initializeBoatTypes() {
    const defaultBoatTypes = [
      { name: "Superyacht", description: "Embarcação de luxo com mais de 24 metros" },
      { name: "Yacht", description: "Embarcação de luxo entre 12 e 24 metros" },
      { name: "Lancha", description: "Embarcação à motor para passeios costeiros" },
      { name: "Jet Ski", description: "Veículo aquático pessoal" },
      { name: "Veleiro", description: "Embarcação à vela" },
      { name: "Catamarã", description: "Embarcação com dois cascos paralelos" },
      { name: "Offshore", description: "Embarcação para alto mar" },
      { name: "Outro", description: "Outros tipos de embarcações" }
    ];
    
    defaultBoatTypes.forEach(type => {
      this.createBoatType(type);
    });
  }
  
  private async createDefaultAdmin() {
    try {
      const now = new Date().toISOString();
      const hashedPassword = await hashPassword("admin123");
      const adminUser: User = {
        id: this.userIdCounter++,
        username: "admin",
        password: hashedPassword,
        email: "admin@funntour.com",
        role: "admin",
        fullName: "Administrator",
        document: "00000000000",
        documentType: "CPF",
        birthDate: "1980-01-01",
        photoUrl: "/uploads/default-avatar.png",
        phone: null,
        address: null,
        city: null,
        state: null,
        createdAt: now,
        updatedAt: now
      };
      
      this.users.set(adminUser.id, adminUser);
      console.log("Created default admin user: admin / admin123");
    } catch (error) {
      console.error("Error creating default admin user:", error);
    }
  }

  private initializeRoutes() {
    const sampleRoutes = [
      { name: "Volta à Ilha Grande", description: "Passeio ao redor da ilha", duration: 8 },
      { name: "Passeio pelas Ilhas Cagarras", description: "Tour pelas ilhas próximas", duration: 4 },
      { name: "Tour pelas praias de Búzios", description: "Visite as melhores praias", duration: 8 },
      { name: "Praia do Dentista e Saco do Céu", description: "Ótimo para mergulho", duration: 4 },
      { name: "Lagoa Azul e Freguesia de Santana", description: "Águas cristalinas", duration: 8 },
      { name: "Passeio ao Pôr do Sol", description: "Romântico pôr do sol no mar", duration: 3 }
    ];

    sampleRoutes.forEach(route => {
      this.createRoute(route);
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  
  async getUserByDocument(document: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.document === document
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Check for duplicates
    const existingUsername = await this.getUserByUsername(insertUser.username);
    if (existingUsername) {
      throw new Error("duplicate username");
    }
    
    const existingEmail = Array.from(this.users.values()).find(
      (user) => user.email === insertUser.email
    );
    if (existingEmail) {
      throw new Error("duplicate email");
    }
    
    const existingDocument = Array.from(this.users.values()).find(
      (user) => user.document === insertUser.document
    );
    if (existingDocument) {
      throw new Error("duplicate document");
    }
    
    // Hash the password
    const hashedPassword = await hashPassword(insertUser.password);
    
    const id = this.userIdCounter++;
    const now = new Date().toISOString();
    const user: User = { 
      ...insertUser,
      password: hashedPassword, 
      id,
      createdAt: now,
      updatedAt: now,
      // Convert nullable fields from undefined to null for consistency
      phone: insertUser.phone || null,
      address: insertUser.address || null,
      city: insertUser.city || null,
      state: insertUser.state || null
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) return undefined;
    
    // Check for duplicates if changing unique fields
    if (userData.username && userData.username !== existingUser.username) {
      const existingUsername = await this.getUserByUsername(userData.username);
      if (existingUsername) {
        throw new Error("duplicate username");
      }
    }
    
    if (userData.email && userData.email !== existingUser.email) {
      const existingEmail = Array.from(this.users.values()).find(
        (user) => user.email === userData.email && user.id !== id
      );
      if (existingEmail) {
        throw new Error("duplicate email");
      }
    }
    
    if (userData.document && userData.document !== existingUser.document) {
      const existingDocument = Array.from(this.users.values()).find(
        (user) => user.document === userData.document && user.id !== id
      );
      if (existingDocument) {
        throw new Error("duplicate document");
      }
    }
    
    // Handle password update separately and hash it if provided
    let passwordToUse = existingUser.password;
    if (userData.password) {
      passwordToUse = await hashPassword(userData.password);
    }
    
    // Update the user
    const updatedUser: User = { 
      ...existingUser, 
      ...userData,
      password: passwordToUse, // Use either existing or newly hashed password
      id, // Ensure the ID stays the same
      updatedAt: new Date().toISOString(),
      // Update nullable fields if provided
      phone: userData.phone !== undefined ? (userData.phone || null) : existingUser.phone,
      address: userData.address !== undefined ? (userData.address || null) : existingUser.address,
      city: userData.city !== undefined ? (userData.city || null) : existingUser.city,
      state: userData.state !== undefined ? (userData.state || null) : existingUser.state
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async deleteUser(id: number): Promise<boolean> {
    // Check if user has photo that needs to be deleted
    const user = this.users.get(id);
    if (user && user.photoUrl) {
      const filePath = path.join(__dirname, "..", user.photoUrl);
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (error) {
        console.error(`Error deleting user profile image ${filePath}:`, error);
      }
    }
    
    return this.users.delete(id);
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  async getPartnerUsers(): Promise<User[]> {
    return Array.from(this.users.values()).filter(
      user => user.role === "parceiro"
    );
  }

  // Boat operations
  async getAllBoats(): Promise<Boat[]> {
    return Array.from(this.boats.values());
  }

  async getBoat(id: number): Promise<Boat | undefined> {
    return this.boats.get(id);
  }

  async createBoat(insertBoat: InsertBoat): Promise<Boat> {
    const id = this.boatIdCounter++;
    const now = new Date().toISOString();
    const boat: Boat = { 
      ...insertBoat, 
      id, 
      createdAt: now, 
      updatedAt: now 
    };
    this.boats.set(id, boat);
    return boat;
  }

  async updateBoat(id: number, insertBoat: InsertBoat): Promise<Boat | undefined> {
    const existingBoat = this.boats.get(id);
    if (!existingBoat) return undefined;

    const updatedBoat: Boat = { 
      ...existingBoat, 
      ...insertBoat, 
      id, 
      updatedAt: new Date().toISOString() 
    };
    this.boats.set(id, updatedBoat);
    return updatedBoat;
  }

  async deleteBoat(id: number): Promise<boolean> {
    // Delete associated images from filesystem
    const images = await this.getBoatImages(id);
    images.forEach(image => {
      const filePath = path.join(__dirname, "..", image.imageUrl);
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (error) {
        console.error(`Error deleting file ${filePath}:`, error);
      }
    });

    // Delete from maps
    const boatExists = this.boats.has(id);
    if (boatExists) {
      this.boats.delete(id);
      // Remove related images and route associations
      const imagesToDelete = Array.from(this.boatImages.values())
        .filter(img => img.boatId === id)
        .map(img => img.id);
      
      imagesToDelete.forEach(imgId => this.boatImages.delete(imgId));
      
      const routesToDelete = Array.from(this.boatRoutes.values())
        .filter(br => br.boatId === id)
        .map(br => br.id);
      
      routesToDelete.forEach(routeId => this.boatRoutes.delete(routeId));
    }
    return boatExists;
  }

  // Boat image operations
  async getBoatImages(boatId: number): Promise<BoatImage[]> {
    return Array.from(this.boatImages.values())
      .filter(image => image.boatId === boatId);
  }

  async addBoatImages(boatId: number, imageUrls: string[]): Promise<BoatImage[]> {
    const images: BoatImage[] = [];
    
    for (const imageUrl of imageUrls) {
      const id = this.imageIdCounter++;
      const now = new Date().toISOString();
      const image: BoatImage = {
        id,
        boatId,
        imageUrl,
        createdAt: now
      };
      this.boatImages.set(id, image);
      images.push(image);
    }
    
    return images;
  }

  async deleteBoatImage(imageId: number): Promise<boolean> {
    const image = this.boatImages.get(imageId);
    if (!image) return false;

    // Delete file from filesystem
    const filePath = path.join(__dirname, "..", image.imageUrl);
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error(`Error deleting file ${filePath}:`, error);
    }

    return this.boatImages.delete(imageId);
  }

  // Boat Type operations
  async getAllBoatTypes(): Promise<BoatType[]> {
    return Array.from(this.boatTypes.values());
  }
  
  async getBoatType(id: number): Promise<BoatType | undefined> {
    return this.boatTypes.get(id);
  }
  
  async createBoatType(boatType: InsertBoatType): Promise<BoatType> {
    // Check if type name already exists
    const existingType = Array.from(this.boatTypes.values()).find(
      (type) => type.name.toLowerCase() === boatType.name.toLowerCase()
    );
    
    if (existingType) {
      throw new Error(`Tipo de embarcação com nome "${boatType.name}" já existe`);
    }
    
    const id = this.boatTypeIdCounter++;
    const now = new Date().toISOString();
    const newBoatType: BoatType = {
      ...boatType,
      id,
      createdAt: now,
      updatedAt: now
    };
    
    this.boatTypes.set(id, newBoatType);
    return newBoatType;
  }
  
  async updateBoatType(id: number, boatType: Partial<InsertBoatType>): Promise<BoatType | undefined> {
    const existingType = this.boatTypes.get(id);
    if (!existingType) return undefined;
    
    // Check for name conflict if name is being updated
    if (boatType.name && boatType.name !== existingType.name) {
      const nameExists = Array.from(this.boatTypes.values()).find(
        (type) => type.name.toLowerCase() === boatType.name.toLowerCase() && type.id !== id
      );
      
      if (nameExists) {
        throw new Error(`Tipo de embarcação com nome "${boatType.name}" já existe`);
      }
    }
    
    const updatedType: BoatType = {
      ...existingType,
      ...boatType,
      id,
      updatedAt: new Date().toISOString()
    };
    
    this.boatTypes.set(id, updatedType);
    return updatedType;
  }
  
  async deleteBoatType(id: number): Promise<boolean> {
    // Check if any boats are using this type before deletion
    const boatsUsingType = Array.from(this.boats.values()).find(
      (boat) => boat.type === this.boatTypes.get(id)?.name
    );
    
    if (boatsUsingType) {
      throw new Error(`Não é possível excluir o tipo de embarcação pois está sendo usado por embarcações existentes`);
    }
    
    return this.boatTypes.delete(id);
  }

  // Route operations
  async getAllRoutes(): Promise<Route[]> {
    return Array.from(this.routes.values());
  }

  async getRoute(id: number): Promise<Route | undefined> {
    return this.routes.get(id);
  }

  async createRoute(insertRoute: InsertRoute): Promise<Route> {
    const id = this.routeIdCounter++;
    const now = new Date().toISOString();
    const route: Route = { 
      ...insertRoute, 
      id, 
      createdAt: now 
    };
    this.routes.set(id, route);
    return route;
  }

  // Boat-Route operations
  async getBoatRoutes(boatId: number): Promise<(BoatRoute & { route: Route })[]> {
    const boatRoutes = Array.from(this.boatRoutes.values())
      .filter(br => br.boatId === boatId);
    
    return boatRoutes.map(br => {
      const route = this.routes.get(br.routeId);
      if (!route) throw new Error(`Route ${br.routeId} not found`);
      
      return {
        ...br,
        route
      };
    });
  }

  async addRouteToBoat(
    boatId: number,
    routeId: number,
    weekdayPrices: Prices,
    weekendPrices: Prices,
    holidayPrices: Prices
  ): Promise<BoatRoute> {
    // Check if boat and route exist
    const boat = this.boats.get(boatId);
    const route = this.routes.get(routeId);
    
    if (!boat) throw new Error(`Boat with ID ${boatId} not found`);
    if (!route) throw new Error(`Route with ID ${routeId} not found`);
    
    // Check if association already exists
    const existingAssociation = Array.from(this.boatRoutes.values())
      .find(br => br.boatId === boatId && br.routeId === routeId);
    
    if (existingAssociation) {
      // Update prices of existing association
      const updated = {
        ...existingAssociation,
        weekdayPrices,
        weekendPrices,
        holidayPrices
      };
      this.boatRoutes.set(existingAssociation.id, updated);
      return updated;
    }
    
    // Create new association
    const id = this.boatRouteIdCounter++;
    const boatRoute: BoatRoute = {
      id,
      boatId,
      routeId,
      weekdayPrices,
      weekendPrices,
      holidayPrices
    };
    this.boatRoutes.set(id, boatRoute);
    return boatRoute;
  }

  async removeRouteFromBoat(boatRouteId: number): Promise<boolean> {
    return this.boatRoutes.delete(boatRouteId);
  }

  // Marina operations
  async getAllMarinas(): Promise<Marina[]> {
    return Array.from(this.marinas.values());
  }

  async getMarina(id: number): Promise<Marina | undefined> {
    return this.marinas.get(id);
  }

  async createMarina(marina: InsertMarina): Promise<Marina> {
    const id = this.marinaIdCounter++;
    const now = new Date().toISOString();
    const newMarina: Marina = {
      ...marina,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.marinas.set(id, newMarina);
    return newMarina;
  }

  async updateMarina(id: number, marina: Partial<InsertMarina>): Promise<Marina | undefined> {
    const existingMarina = this.marinas.get(id);
    if (!existingMarina) return undefined;

    const updatedMarina: Marina = {
      ...existingMarina,
      ...marina,
      id,
      updatedAt: new Date().toISOString()
    };
    this.marinas.set(id, updatedMarina);
    return updatedMarina;
  }

  async deleteMarina(id: number): Promise<boolean> {
    // Check if any boats are using this marina
    const boatsUsingMarina = Array.from(this.boats.values()).find(
      (boat) => boat.marina === this.marinas.get(id)?.name
    );
    
    if (boatsUsingMarina) {
      throw new Error(`Não é possível excluir a marina pois está sendo usada por embarcações existentes`);
    }
    
    return this.marinas.delete(id);
  }

  // Booking operations
  async getAllBookings(): Promise<Booking[]> {
    return Array.from(this.bookings.values());
  }

  async getBooking(id: number): Promise<Booking | undefined> {
    return this.bookings.get(id);
  }

  async getUserBookings(userId: number): Promise<Booking[]> {
    return Array.from(this.bookings.values())
      .filter(booking => booking.userId === userId);
  }

  async createBooking(booking: InsertBooking): Promise<Booking> {
    // Check if the boat, route, marina, and user exist
    const boat = this.boats.get(booking.boatId);
    if (!boat) throw new Error(`Boat with ID ${booking.boatId} not found`);
    
    const route = this.routes.get(booking.routeId);
    if (!route) throw new Error(`Route with ID ${booking.routeId} not found`);
    
    const marina = this.marinas.get(booking.marinaId);
    if (!marina) throw new Error(`Marina with ID ${booking.marinaId} not found`);
    
    const user = this.users.get(booking.userId);
    if (!user) throw new Error(`User with ID ${booking.userId} not found`);
    
    const id = this.bookingIdCounter++;
    const now = new Date().toISOString();
    
    const newBooking: Booking = {
      ...booking,
      id,
      createdAt: now,
      updatedAt: now
    };
    
    this.bookings.set(id, newBooking);
    return newBooking;
  }

  async updateBooking(id: number, booking: Partial<InsertBooking>): Promise<Booking | undefined> {
    const existingBooking = this.bookings.get(id);
    if (!existingBooking) return undefined;
    
    // Validate referenced entities if they're being updated
    if (booking.boatId && booking.boatId !== existingBooking.boatId) {
      const boat = this.boats.get(booking.boatId);
      if (!boat) throw new Error(`Boat with ID ${booking.boatId} not found`);
    }
    
    if (booking.routeId && booking.routeId !== existingBooking.routeId) {
      const route = this.routes.get(booking.routeId);
      if (!route) throw new Error(`Route with ID ${booking.routeId} not found`);
    }
    
    if (booking.marinaId && booking.marinaId !== existingBooking.marinaId) {
      const marina = this.marinas.get(booking.marinaId);
      if (!marina) throw new Error(`Marina with ID ${booking.marinaId} not found`);
    }
    
    if (booking.userId && booking.userId !== existingBooking.userId) {
      const user = this.users.get(booking.userId);
      if (!user) throw new Error(`User with ID ${booking.userId} not found`);
    }
    
    const updatedBooking: Booking = {
      ...existingBooking,
      ...booking,
      id,
      updatedAt: new Date().toISOString()
    };
    
    this.bookings.set(id, updatedBooking);
    return updatedBooking;
  }

  async updateBookingStatus(id: number, status: BookingStatus): Promise<Booking | undefined> {
    const existingBooking = this.bookings.get(id);
    if (!existingBooking) return undefined;
    
    const updatedBooking: Booking = {
      ...existingBooking,
      status,
      updatedAt: new Date().toISOString()
    };
    
    this.bookings.set(id, updatedBooking);
    return updatedBooking;
  }

  async deleteBooking(id: number): Promise<boolean> {
    return this.bookings.delete(id);
  }
  
  // Password recovery operations
  async updateUserPassword(userId: number, newPassword: string): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;
    
    const hashedPassword = await hashPassword(newPassword);
    
    const updatedUser: User = {
      ...user,
      password: hashedPassword,
      updatedAt: new Date().toISOString()
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }
  
  async createRecoveryCode(userId: number): Promise<string> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");
    
    // Generate a random 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Code expires in 15 minutes
    const expiresAt = Date.now() + 15 * 60 * 1000;
    
    this.recoveryCodes.set(userId, { code, expiresAt });
    
    return code;
  }
  
  async verifyRecoveryCode(userId: number, code: string): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");
    
    const recoveryData = this.recoveryCodes.get(userId);
    if (!recoveryData) return false;
    
    const { code: storedCode, expiresAt } = recoveryData;
    
    // Check if code is correct and not expired
    if (storedCode === code && expiresAt > Date.now()) {
      return true;
    }
    
    return false;
  }
  
  // Article operations
  async getAllArticles(): Promise<Article[]> {
    return Array.from(this.articles.values());
  }

  async getActiveArticles(): Promise<Article[]> {
    return Array.from(this.articles.values())
      .filter(article => article.enabled && !article.isDraft && !article.isDeleted);
  }

  async getArticle(id: number): Promise<Article | undefined> {
    return this.articles.get(id);
  }

  async getArticleByPath(path: string): Promise<Article | undefined> {
    return Array.from(this.articles.values())
      .find(article => article.path === path);
  }

  async createArticle(article: InsertArticle): Promise<Article> {
    // Check for path uniqueness
    const existingPath = await this.getArticleByPath(article.path);
    if (existingPath) {
      throw new Error(`Artigo com o caminho "${article.path}" já existe`);
    }

    const id = this.articleIdCounter++;
    const now = new Date().toISOString();
    const newArticle: Article = {
      ...article,
      id,
      createdAt: now,
      updatedAt: now
    };
    
    this.articles.set(id, newArticle);
    return newArticle;
  }

  async updateArticle(id: number, articleData: Partial<InsertArticle>): Promise<Article | undefined> {
    const existingArticle = this.articles.get(id);
    if (!existingArticle) return undefined;

    // Check path uniqueness if it's being updated
    if (articleData.path && articleData.path !== existingArticle.path) {
      const existingPath = await this.getArticleByPath(articleData.path);
      if (existingPath) {
        throw new Error(`Artigo com o caminho "${articleData.path}" já existe`);
      }
    }

    const updatedArticle: Article = {
      ...existingArticle,
      ...articleData,
      id,
      updatedAt: new Date().toISOString()
    };

    this.articles.set(id, updatedArticle);
    return updatedArticle;
  }

  async toggleArticleStatus(id: number, field: 'enabled' | 'isDraft' | 'isDeleted', value: boolean): Promise<Article | undefined> {
    const article = this.articles.get(id);
    if (!article) return undefined;

    const updatedArticle: Article = {
      ...article,
      [field]: value,
      updatedAt: new Date().toISOString()
    };

    this.articles.set(id, updatedArticle);
    return updatedArticle;
  }

  async deleteArticle(id: number): Promise<boolean> {
    // Soft delete - move to trash
    const article = this.articles.get(id);
    if (!article) return false;

    // Update the isDeleted flag
    const updatedArticle: Article = {
      ...article,
      isDeleted: true,
      updatedAt: new Date().toISOString()
    };

    this.articles.set(id, updatedArticle);
    return true;
  }

  async permanentlyDeleteArticle(id: number): Promise<boolean> {
    // Hard delete - remove from database
    return this.articles.delete(id);
  }

  // Country operations
  async getAllCountries(): Promise<Country[]> {
    return Array.from(this.countries.values());
  }

  async getCountry(id: number): Promise<Country | undefined> {
    return this.countries.get(id);
  }

  async getCountryByName(name: string): Promise<Country | undefined> {
    return Array.from(this.countries.values()).find(
      (country) => country.name.toLowerCase() === name.toLowerCase()
    );
  }

  async getCountryByCode(code: string): Promise<Country | undefined> {
    return Array.from(this.countries.values()).find(
      (country) => country.code.toLowerCase() === code.toLowerCase()
    );
  }

  async createCountry(insertCountry: InsertCountry): Promise<Country> {
    // Check for duplicate name
    const existingByName = await this.getCountryByName(insertCountry.name);
    if (existingByName) {
      throw new Error(`País com nome "${insertCountry.name}" já existe`);
    }

    // Check for duplicate code
    const existingByCode = await this.getCountryByCode(insertCountry.code);
    if (existingByCode) {
      throw new Error(`País com sigla "${insertCountry.code}" já existe`);
    }

    const id = this.countryIdCounter++;
    const now = new Date().toISOString();
    
    const country: Country = {
      ...insertCountry,
      id,
      createdAt: now,
      updatedAt: now
    };
    
    this.countries.set(id, country);
    return country;
  }

  async updateCountry(id: number, countryData: Partial<InsertCountry>): Promise<Country | undefined> {
    const existingCountry = this.countries.get(id);
    if (!existingCountry) return undefined;

    // Check for duplicate name if name is being changed
    if (countryData.name && countryData.name !== existingCountry.name) {
      const nameExists = Array.from(this.countries.values()).find(
        (country) => country.name.toLowerCase() === countryData.name!.toLowerCase() && country.id !== id
      );
      
      if (nameExists) {
        throw new Error(`País com nome "${countryData.name}" já existe`);
      }
    }

    // Check for duplicate code if code is being changed
    if (countryData.code && countryData.code !== existingCountry.code) {
      const codeExists = Array.from(this.countries.values()).find(
        (country) => country.code.toLowerCase() === countryData.code!.toLowerCase() && country.id !== id
      );
      
      if (codeExists) {
        throw new Error(`País com sigla "${countryData.code}" já existe`);
      }
    }

    const updatedCountry: Country = {
      ...existingCountry,
      ...countryData,
      id,
      updatedAt: new Date().toISOString()
    };
    
    this.countries.set(id, updatedCountry);
    return updatedCountry;
  }

  async deleteCountry(id: number): Promise<boolean> {
    // Check if any states are associated with this country
    const statesUsingCountry = Array.from(this.states.values())
      .find(state => state.countryId === id);
    
    if (statesUsingCountry) {
      throw new Error(`Não é possível excluir o país pois existem estados vinculados a ele`);
    }
    
    return this.countries.delete(id);
  }

  // State operations
  async getAllStates(): Promise<State[]> {
    return Array.from(this.states.values());
  }

  async getState(id: number): Promise<State | undefined> {
    return this.states.get(id);
  }

  async getStateByNameAndCountry(name: string, countryId: number): Promise<State | undefined> {
    return Array.from(this.states.values()).find(
      (state) => state.name.toLowerCase() === name.toLowerCase() && state.countryId === countryId
    );
  }

  async getStateByCodeAndCountry(code: string, countryId: number): Promise<State | undefined> {
    return Array.from(this.states.values()).find(
      (state) => state.code.toLowerCase() === code.toLowerCase() && state.countryId === countryId
    );
  }

  async getStatesByCountry(countryId: number): Promise<State[]> {
    return Array.from(this.states.values())
      .filter(state => state.countryId === countryId);
  }

  async createState(insertState: InsertState): Promise<State> {
    // Verify if the country exists
    const country = await this.getCountry(insertState.countryId);
    if (!country) {
      throw new Error(`País com ID ${insertState.countryId} não encontrado`);
    }

    // Check for duplicate name within the same country
    const existingByName = await this.getStateByNameAndCountry(insertState.name, insertState.countryId);
    if (existingByName) {
      throw new Error(`Estado com nome "${insertState.name}" já existe para este país`);
    }

    // Check for duplicate code within the same country
    const existingByCode = await this.getStateByCodeAndCountry(insertState.code, insertState.countryId);
    if (existingByCode) {
      throw new Error(`Estado com sigla "${insertState.code}" já existe para este país`);
    }

    const id = this.stateIdCounter++;
    const now = new Date().toISOString();
    
    const state: State = {
      ...insertState,
      id,
      createdAt: now,
      updatedAt: now
    };
    
    this.states.set(id, state);
    return state;
  }

  async updateState(id: number, stateData: Partial<InsertState>): Promise<State | undefined> {
    const existingState = this.states.get(id);
    if (!existingState) return undefined;

    // Check countryId if it's being updated
    if (stateData.countryId && stateData.countryId !== existingState.countryId) {
      const country = await this.getCountry(stateData.countryId);
      if (!country) {
        throw new Error(`País com ID ${stateData.countryId} não encontrado`);
      }
    }

    const countryId = stateData.countryId || existingState.countryId;

    // Check for duplicate name if name is being changed
    if (stateData.name && stateData.name !== existingState.name) {
      const nameExists = await this.getStateByNameAndCountry(stateData.name, countryId);
      if (nameExists && nameExists.id !== id) {
        throw new Error(`Estado com nome "${stateData.name}" já existe para este país`);
      }
    }

    // Check for duplicate code if code is being changed
    if (stateData.code && stateData.code !== existingState.code) {
      const codeExists = await this.getStateByCodeAndCountry(stateData.code, countryId);
      if (codeExists && codeExists.id !== id) {
        throw new Error(`Estado com sigla "${stateData.code}" já existe para este país`);
      }
    }

    const updatedState: State = {
      ...existingState,
      ...stateData,
      id,
      updatedAt: new Date().toISOString()
    };
    
    this.states.set(id, updatedState);
    return updatedState;
  }

  async deleteState(id: number): Promise<boolean> {
    // Check if any cities are associated with this state
    const citiesUsingState = Array.from(this.cities.values())
      .find(city => city.stateId === id);
    
    if (citiesUsingState) {
      throw new Error(`Não é possível excluir o estado pois existem cidades vinculadas a ele`);
    }
    
    return this.states.delete(id);
  }

  // City operations
  async getAllCities(): Promise<City[]> {
    return Array.from(this.cities.values());
  }

  async getCity(id: number): Promise<City | undefined> {
    return this.cities.get(id);
  }

  async getCityByNameAndState(name: string, stateId: number): Promise<City | undefined> {
    return Array.from(this.cities.values()).find(
      (city) => city.name.toLowerCase() === name.toLowerCase() && city.stateId === stateId
    );
  }

  async getCitiesByState(stateId: number): Promise<City[]> {
    return Array.from(this.cities.values())
      .filter(city => city.stateId === stateId);
  }

  async createCity(insertCity: InsertCity): Promise<City> {
    // Verify if the state exists
    const state = await this.getState(insertCity.stateId);
    if (!state) {
      throw new Error(`Estado com ID ${insertCity.stateId} não encontrado`);
    }

    // Check for duplicate name within the same state
    const existingByName = await this.getCityByNameAndState(insertCity.name, insertCity.stateId);
    if (existingByName) {
      throw new Error(`Cidade com nome "${insertCity.name}" já existe para este estado`);
    }

    const id = this.cityIdCounter++;
    const now = new Date().toISOString();
    
    const city: City = {
      ...insertCity,
      id,
      createdAt: now,
      updatedAt: now
    };
    
    this.cities.set(id, city);
    return city;
  }

  async updateCity(id: number, cityData: Partial<InsertCity>): Promise<City | undefined> {
    const existingCity = this.cities.get(id);
    if (!existingCity) return undefined;

    // Check stateId if it's being updated
    if (cityData.stateId && cityData.stateId !== existingCity.stateId) {
      const state = await this.getState(cityData.stateId);
      if (!state) {
        throw new Error(`Estado com ID ${cityData.stateId} não encontrado`);
      }
    }

    const stateId = cityData.stateId || existingCity.stateId;

    // Check for duplicate name if name is being changed
    if (cityData.name && cityData.name !== existingCity.name) {
      const nameExists = await this.getCityByNameAndState(cityData.name, stateId);
      if (nameExists && nameExists.id !== id) {
        throw new Error(`Cidade com nome "${cityData.name}" já existe para este estado`);
      }
    }

    const updatedCity: City = {
      ...existingCity,
      ...cityData,
      id,
      updatedAt: new Date().toISOString()
    };
    
    this.cities.set(id, updatedCity);
    return updatedCity;
  }

  async deleteCity(id: number): Promise<boolean> {
    return this.cities.delete(id);
  }
  
  // Page operations
  async getAllPages(): Promise<Page[]> {
    return Array.from(this.pages.values());
  }
  
  async getPublishedPages(): Promise<Page[]> {
    return Array.from(this.pages.values())
      .filter(page => page.status === 'published');
  }
  
  async getPage(id: number): Promise<Page | undefined> {
    return this.pages.get(id);
  }
  
  async getPageBySlug(slug: string): Promise<Page | undefined> {
    return Array.from(this.pages.values())
      .find(page => page.slug === slug);
  }
  
  async createPage(page: InsertPage): Promise<Page> {
    // Check for slug uniqueness
    const existingPage = await this.getPageBySlug(page.slug);
    if (existingPage) {
      throw new Error(`Já existe uma página com o slug '${page.slug}'.`);
    }
    
    const id = this.pageIdCounter++;
    const now = new Date().toISOString();
    const newPage: Page = {
      ...page,
      id,
      createdAt: now,
      updatedAt: now,
      // Convert nullable fields from undefined to null for consistency
      description: page.description || null,
      content: page.content || null,
      canonicalUrl: page.canonicalUrl || null,
      imageUrl: page.imageUrl || null,
      imageAlt: page.imageAlt || null,
      metaTitle: page.metaTitle || null,
      metaDescription: page.metaDescription || null,
      publishedAt: page.publishedAt || null,
      createdBy: page.createdBy || null,
      updatedBy: page.updatedBy || null
    };
    
    this.pages.set(id, newPage);
    return newPage;
  }
  
  async updatePage(id: number, pageData: Partial<InsertPage>): Promise<Page | undefined> {
    const existingPage = this.pages.get(id);
    if (!existingPage) return undefined;
    
    // Check slug uniqueness if changed
    if (pageData.slug && pageData.slug !== existingPage.slug) {
      const slugExists = await this.getPageBySlug(pageData.slug);
      if (slugExists) {
        throw new Error(`Já existe uma página com o slug '${pageData.slug}'.`);
      }
    }
    
    const updatedPage: Page = {
      ...existingPage,
      ...pageData,
      id,
      updatedAt: new Date().toISOString(),
      // Update nullable fields if provided
      description: pageData.description !== undefined ? (pageData.description || null) : existingPage.description,
      content: pageData.content !== undefined ? (pageData.content || null) : existingPage.content,
      canonicalUrl: pageData.canonicalUrl !== undefined ? (pageData.canonicalUrl || null) : existingPage.canonicalUrl,
      imageUrl: pageData.imageUrl !== undefined ? (pageData.imageUrl || null) : existingPage.imageUrl,
      imageAlt: pageData.imageAlt !== undefined ? (pageData.imageAlt || null) : existingPage.imageAlt,
      metaTitle: pageData.metaTitle !== undefined ? (pageData.metaTitle || null) : existingPage.metaTitle,
      metaDescription: pageData.metaDescription !== undefined ? (pageData.metaDescription || null) : existingPage.metaDescription,
      publishedAt: pageData.publishedAt !== undefined ? (pageData.publishedAt || null) : existingPage.publishedAt,
      createdBy: pageData.createdBy !== undefined ? (pageData.createdBy || null) : existingPage.createdBy,
      updatedBy: pageData.updatedBy !== undefined ? (pageData.updatedBy || null) : existingPage.updatedBy
    };
    
    this.pages.set(id, updatedPage);
    return updatedPage;
  }
  
  async updatePageStatus(id: number, status: string): Promise<Page | undefined> {
    const existingPage = this.pages.get(id);
    if (!existingPage) return undefined;
    
    let publishedAt = existingPage.publishedAt;
    // If page is being published for the first time, set publishedAt
    if (status === 'published' && existingPage.status !== 'published') {
      publishedAt = new Date().toISOString();
    }
    
    const updatedPage: Page = {
      ...existingPage,
      status,
      publishedAt,
      updatedAt: new Date().toISOString()
    };
    
    this.pages.set(id, updatedPage);
    return updatedPage;
  }
  
  async deletePage(id: number): Promise<boolean> {
    const page = this.pages.get(id);
    if (!page) return false;
    
    // Delete the image file if it exists
    if (page.imageUrl) {
      const filePath = path.join(__dirname, "..", page.imageUrl);
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (error) {
        console.error(`Error deleting page image ${filePath}:`, error);
      }
    }
    
    // Delete any SEO records for this page
    const pageSeoEntries = Array.from(this.pageSeos.values())
      .filter(seo => seo.pageId === id);
    
    pageSeoEntries.forEach(seo => {
      this.pageSeos.delete(seo.id);
    });
    
    return this.pages.delete(id);
  }
  
  // Page SEO operations
  async getPageSeo(id: number): Promise<PageSeo | undefined> {
    return this.pageSeos.get(id);
  }
  
  async getPageSeoByPageId(pageId: number): Promise<PageSeo | undefined> {
    return Array.from(this.pageSeos.values()).find(
      (seo) => seo.pageId === pageId
    );
  }
  
  async createPageSeo(pageSeo: PageSeo): Promise<PageSeo> {
    // Verify page exists
    const page = this.pages.get(pageSeo.pageId);
    if (!page) {
      throw new Error(`Page with ID ${pageSeo.pageId} not found`);
    }
    
    // Check if page already has SEO settings
    const existingSeo = await this.getPageSeoByPageId(pageSeo.pageId);
    if (existingSeo) {
      return this.updatePageSeo(existingSeo.id, pageSeo);
    }
    
    const id = this.pageSeoIdCounter++;
    const newPageSeo: PageSeo = {
      ...pageSeo,
      id
    };
    
    this.pageSeos.set(id, newPageSeo);
    return newPageSeo;
  }
  
  async updatePageSeo(id: number, pageSeoData: Partial<PageSeo>): Promise<PageSeo | undefined> {
    const existingSeo = this.pageSeos.get(id);
    if (!existingSeo) return undefined;
    
    // If pageId is being changed, verify the new page exists
    if (pageSeoData.pageId && pageSeoData.pageId !== existingSeo.pageId) {
      const newPage = this.pages.get(pageSeoData.pageId);
      if (!newPage) {
        throw new Error(`Page with ID ${pageSeoData.pageId} not found`);
      }
    }
    
    const updatedSeo: PageSeo = {
      ...existingSeo,
      ...pageSeoData,
      id
    };
    
    this.pageSeos.set(id, updatedSeo);
    return updatedSeo;
  }
  
  async deletePageSeo(id: number): Promise<boolean> {
    return this.pageSeos.delete(id);
  }

  // Itinerary operations (Roteiros)
  async getAllItineraries(): Promise<Itinerary[]> {
    return Array.from(this.itineraries.values());
  }

  async getItinerary(id: number): Promise<Itinerary | undefined> {
    return this.itineraries.get(id);
  }

  async getItinerariesByPartner(partnerId: number): Promise<Itinerary[]> {
    return Array.from(this.itineraries.values())
      .filter(itinerary => itinerary.partnerId === partnerId);
  }

  async createItinerary(itinerary: InsertItinerary): Promise<Itinerary> {
    // Check if partner exists
    const partner = this.users.get(itinerary.partnerId);
    if (!partner) {
      throw new Error(`Partner with ID ${itinerary.partnerId} not found`);
    }
    
    if (partner.role !== 'parceiro') {
      throw new Error(`User with ID ${itinerary.partnerId} is not a partner`);
    }

    const id = this.itineraryIdCounter++;
    const now = new Date().toISOString();
    const newItinerary: Itinerary = {
      ...itinerary,
      id,
      createdAt: now,
      updatedAt: now
    };
    
    this.itineraries.set(id, newItinerary);
    return newItinerary;
  }

  async updateItinerary(id: number, itineraryData: Partial<InsertItinerary>): Promise<Itinerary | undefined> {
    const existingItinerary = this.itineraries.get(id);
    if (!existingItinerary) return undefined;

    // If partnerId is being updated, verify the new partner exists and is a partner
    if (itineraryData.partnerId && itineraryData.partnerId !== existingItinerary.partnerId) {
      const partner = this.users.get(itineraryData.partnerId);
      if (!partner) {
        throw new Error(`Partner with ID ${itineraryData.partnerId} not found`);
      }
      
      if (partner.role !== 'parceiro') {
        throw new Error(`User with ID ${itineraryData.partnerId} is not a partner`);
      }
    }

    const updatedItinerary: Itinerary = {
      ...existingItinerary,
      ...itineraryData,
      id,
      updatedAt: new Date().toISOString()
    };

    this.itineraries.set(id, updatedItinerary);
    return updatedItinerary;
  }

  async deleteItinerary(id: number): Promise<boolean> {
    return this.itineraries.delete(id);
  }

  // Partner Prices operations (Preços Parceiro)
  async getAllPartnerPrices(): Promise<PartnerPrice[]> {
    return Array.from(this.partnerPrices.values());
  }

  async getPartnerPrice(id: number): Promise<PartnerPrice | undefined> {
    return this.partnerPrices.get(id);
  }

  async getPartnerPricesByPartner(partnerId: number): Promise<PartnerPrice[]> {
    return Array.from(this.partnerPrices.values())
      .filter(price => price.partnerId === partnerId);
  }

  async getPartnerPricesByBoat(boatId: number): Promise<PartnerPrice[]> {
    return Array.from(this.partnerPrices.values())
      .filter(price => price.boatId === boatId);
  }

  async getPartnerPriceByPartnerAndBoat(partnerId: number, boatId: number): Promise<PartnerPrice | undefined> {
    return Array.from(this.partnerPrices.values())
      .find(price => price.partnerId === partnerId && price.boatId === boatId);
  }

  async createPartnerPrice(partnerPrice: InsertPartnerPrice): Promise<PartnerPrice> {
    // Check if partner exists and is a partner
    const partner = this.users.get(partnerPrice.partnerId);
    if (!partner) {
      throw new Error(`Partner with ID ${partnerPrice.partnerId} not found`);
    }
    
    if (partner.role !== 'parceiro') {
      throw new Error(`User with ID ${partnerPrice.partnerId} is not a partner`);
    }

    // Check if boat exists
    const boat = this.boats.get(partnerPrice.boatId);
    if (!boat) {
      throw new Error(`Boat with ID ${partnerPrice.boatId} not found`);
    }

    // Check if there's already a price set for this partner and boat
    const existingPrice = await this.getPartnerPriceByPartnerAndBoat(
      partnerPrice.partnerId, 
      partnerPrice.boatId
    );
    
    if (existingPrice) {
      throw new Error(`Price already set for partner ID ${partnerPrice.partnerId} and boat ID ${partnerPrice.boatId}`);
    }

    const id = this.partnerPriceIdCounter++;
    const now = new Date().toISOString();
    const newPartnerPrice: PartnerPrice = {
      ...partnerPrice,
      id,
      createdAt: now,
      updatedAt: now
    };
    
    this.partnerPrices.set(id, newPartnerPrice);
    return newPartnerPrice;
  }

  async updatePartnerPrice(id: number, partnerPriceData: Partial<InsertPartnerPrice>): Promise<PartnerPrice | undefined> {
    const existingPrice = this.partnerPrices.get(id);
    if (!existingPrice) return undefined;

    // If partnerId is being updated, verify the new partner exists
    if (partnerPriceData.partnerId && partnerPriceData.partnerId !== existingPrice.partnerId) {
      const partner = this.users.get(partnerPriceData.partnerId);
      if (!partner) {
        throw new Error(`Partner with ID ${partnerPriceData.partnerId} not found`);
      }
      
      if (partner.role !== 'parceiro') {
        throw new Error(`User with ID ${partnerPriceData.partnerId} is not a partner`);
      }
    }

    // If boatId is being updated, verify the new boat exists
    if (partnerPriceData.boatId && partnerPriceData.boatId !== existingPrice.boatId) {
      const boat = this.boats.get(partnerPriceData.boatId);
      if (!boat) {
        throw new Error(`Boat with ID ${partnerPriceData.boatId} not found`);
      }
      
      // If both partnerId and boatId are changing, check for duplicates
      if (partnerPriceData.partnerId && partnerPriceData.partnerId !== existingPrice.partnerId) {
        const duplicatePrice = await this.getPartnerPriceByPartnerAndBoat(
          partnerPriceData.partnerId, 
          partnerPriceData.boatId
        );
        
        if (duplicatePrice) {
          throw new Error(`Price already set for partner ID ${partnerPriceData.partnerId} and boat ID ${partnerPriceData.boatId}`);
        }
      }
    }

    const updatedPrice: PartnerPrice = {
      ...existingPrice,
      ...partnerPriceData,
      id,
      updatedAt: new Date().toISOString()
    };

    this.partnerPrices.set(id, updatedPrice);
    return updatedPrice;
  }

  async deletePartnerPrice(id: number): Promise<boolean> {
    return this.partnerPrices.delete(id);
  }
}

export const storage = new MemStorage();
