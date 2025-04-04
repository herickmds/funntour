import { pgTable, text, serial, integer, boolean, jsonb, timestamp, varchar, date } from "drizzle-orm/pg-core";
import { PgArray as array } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const userRoles = ["admin", "cliente", "parceiro"] as const;

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default("cliente"),
  fullName: text("full_name").notNull(),
  document: text("document").notNull().unique(), // CPF/CNPJ
  documentType: text("document_type").notNull(), // CPF ou CNPJ
  birthDate: text("birth_date").notNull(),
  photoUrl: text("photo_url").notNull(),
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
  updatedAt: text("updated_at").notNull().default(new Date().toISOString()),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  role: true,
  fullName: true,
  document: true,
  documentType: true,
  birthDate: true,
  photoUrl: true,
  phone: true,
  address: true,
  city: true,
  state: true,
});

// Validação personalizada para senha forte
const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+])[A-Za-z\d!@#$%^&*()_+]{8,}$/;

// Schema para validação de usuário com regras específicas
export const validationUserSchema = insertUserSchema.extend({
  password: z.string()
    .min(8, "A senha deve ter pelo menos 8 caracteres")
    .regex(
      strongPasswordRegex,
      "A senha deve conter 1 caractere especial, 1 caractere numérico, 1 letra maiúscula e 1 letra minúscula e ser maior que 8 dígitos!"
    ),
  confirmPassword: z.string().min(1, "Confirmação de senha é obrigatória"),
  role: z.enum(userRoles, {
    errorMap: () => ({ message: "Perfil de usuário inválido" })
  }),
  document: z.string().min(1, "CPF/CNPJ é obrigatório"),
  documentType: z.enum(["CPF", "CNPJ"], {
    errorMap: () => ({ message: "Tipo de documento inválido" })
  }),
  birthDate: z.string().min(1, "Data de nascimento é obrigatória"),
  photoUrl: z.string().min(1, "Foto é obrigatória"),
  fullName: z.string().min(1, "Nome completo é obrigatório"),
  isAdult: z.boolean().refine((val) => val === true, {
    message: "É necessário confirmar que você é maior de idade"
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Senhas não são iguais!",
  path: ["confirmPassword"]
});

export const loginUserSchema = z.object({
  username: z.string().min(1, "Nome de usuário é obrigatório"),
  password: z.string().min(1, "Senha é obrigatória"),
});

// Modelo para Tipos de Embarcação
export const boatTypeTable = pgTable("boat_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
  updatedAt: text("updated_at").notNull().default(new Date().toISOString()),
});

export const insertBoatTypeSchema = createInsertSchema(boatTypeTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Lista de tipos de embarcação padrão (para compatibilidade)
export const boatTypes = [
  "Superyacht",
  "Yacht",
  "Lancha",
  "Jet ski",
  "Veleiro",
  "Catamarã",
  "Offshore",
  "Outro",
] as const;

export const boats = pgTable("boats", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  status: text("status").notNull().default("active"),
  type: text("type").notNull(),
  passengerCount: integer("passenger_count").notNull(),
  hasSailor: boolean("has_sailor").notNull().default(false),
  model: text("model"),
  size: integer("size"),
  marina: text("marina"),
  cruiseSpeed: text("cruise_speed"),
  allowsOvernight: boolean("allows_overnight").notNull().default(false),
  country: text("country"),
  state: text("state"),
  city: text("city"),
  fuel: text("fuel"),
  suites: integer("suites"),
  cabins: integer("cabins"),
  bathrooms: integer("bathrooms"),
  tieDocument: text("tie_document").notNull(),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
  updatedAt: text("updated_at").notNull().default(new Date().toISOString()),
});

export const boatImages = pgTable("boat_images", {
  id: serial("id").primaryKey(),
  boatId: integer("boat_id").notNull(),
  imageUrl: text("image_url").notNull(),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
});

export const routes = pgTable("routes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  duration: integer("duration").notNull(), // in hours
  price: integer("price").notNull().default(0), // preço base em centavos
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
});

export const boatRoutes = pgTable("boat_routes", {
  id: serial("id").primaryKey(),
  boatId: integer("boat_id").notNull(),
  routeId: integer("route_id").notNull(),
  weekdayPrices: jsonb("weekday_prices").notNull(), // { morning: number, afternoon: number, night: number }
  weekendPrices: jsonb("weekend_prices").notNull(), // { morning: number, afternoon: number, night: number }
  holidayPrices: jsonb("holiday_prices").notNull(), // { morning: number, afternoon: number, night: number }
});

export const insertBoatSchema = createInsertSchema(boats).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Formulário estendido que inclui campo obrigatório para roteiro
export const boatFormSchema = insertBoatSchema.extend({
  routeId: z.number().min(1, "É necessário vincular pelo menos um roteiro"),
});

export const insertBoatImageSchema = createInsertSchema(boatImages).omit({
  id: true,
  createdAt: true,
});

export const insertRouteSchema = createInsertSchema(routes).omit({
  id: true,
  createdAt: true,
});

export const insertBoatRouteSchema = createInsertSchema(boatRoutes).omit({
  id: true,
});

export const pricesSchema = z.object({
  morning: z.number().min(0),
  afternoon: z.number().min(0),
  night: z.number().min(0),
});

// Marinas schema
export const marinas = pgTable("marinas", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  city: text("city"),
  state: text("state"),
  country: text("country"),
  address: text("address"),
  contactName: text("contact_name"),
  contactPhone: text("contact_phone"),
  contactEmail: text("contact_email"),
  description: text("description"),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
  updatedAt: text("updated_at").notNull().default(new Date().toISOString()),
});

export const insertMarinaSchema = createInsertSchema(marinas).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;

export type Boat = typeof boats.$inferSelect;
export type InsertBoat = z.infer<typeof insertBoatSchema>;

export type BoatImage = typeof boatImages.$inferSelect;
export type InsertBoatImage = z.infer<typeof insertBoatImageSchema>;

export type Route = typeof routes.$inferSelect;
export type InsertRoute = z.infer<typeof insertRouteSchema>;

export type BoatRoute = typeof boatRoutes.$inferSelect;
export type InsertBoatRoute = z.infer<typeof insertBoatRouteSchema>;

export type BoatType = typeof boatTypeTable.$inferSelect;
export type InsertBoatType = z.infer<typeof insertBoatTypeSchema>;

export type Prices = z.infer<typeof pricesSchema>;

export type Marina = typeof marinas.$inferSelect;
export type InsertMarina = z.infer<typeof insertMarinaSchema>;

// Bookings schema
export const bookingStatusOptions = ["pending", "confirmed", "cancelled", "completed"] as const;
export type BookingStatus = typeof bookingStatusOptions[number];

export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  boatId: integer("boat_id").notNull(),
  routeId: integer("route_id").notNull(),
  marinaId: integer("marina_id").notNull(),
  date: text("date").notNull(), // ISO String format
  period: text("period", { enum: ["morning", "afternoon", "night"] }).notNull(),
  status: text("status", { enum: ["pending", "confirmed", "cancelled", "completed"] }).notNull().default("pending"),
  passengerCount: integer("passenger_count").notNull(),
  totalPrice: integer("total_price").notNull(), // stored in cents
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone"),
  specialRequests: text("special_requests"),
  paymentStatus: text("payment_status", { enum: ["pending", "paid", "refunded"] }).notNull().default("pending"),
  paymentMethod: text("payment_method"),
  paymentDate: text("payment_date"),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
  updatedAt: text("updated_at").notNull().default(new Date().toISOString()),
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;

// Articles schema
export const articles = pgTable("articles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  path: text("path").notNull().unique(),
  author: text("author").notNull(),
  description: text("description").notNull(),
  paragraphs: jsonb("paragraphs").notNull(), // Armazenará um array de strings como JSON
  image: text("image"),
  caption: text("caption"),
  tags: jsonb("tags"), // Armazenará um array de strings como JSON
  publicationDate: text("publication_date"),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
  updatedAt: text("updated_at").notNull().default(new Date().toISOString()),
  enabled: boolean("enabled").notNull().default(true),
  isDraft: boolean("is_draft").notNull().default(false),
  isDeleted: boolean("is_deleted").notNull().default(false),
});

export const insertArticleSchema = createInsertSchema(articles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Adicione um schema mais completo para validação
export const articleFormSchema = insertArticleSchema.extend({
  paragraphs: z.array(z.string().min(1, "O parágrafo não pode estar vazio")).min(1, "O artigo deve ter pelo menos um parágrafo"),
  title: z.string().min(3, "O título deve ter pelo menos 3 caracteres"),
  description: z.string().min(10, "A descrição deve ter pelo menos 10 caracteres"),
  author: z.string().min(3, "O nome do autor deve ter pelo menos 3 caracteres"),
  path: z
    .string()
    .min(3, "O caminho deve ter pelo menos 3 caracteres")
    .regex(/^[a-z0-9-]+$/, "O caminho deve conter apenas letras minúsculas, números e hífens"),
  tags: z.array(z.string()).min(1, "Adicione pelo menos uma tag"),
});

export type Article = typeof articles.$inferSelect;
export type InsertArticle = z.infer<typeof insertArticleSchema>;
export type ArticleFormValues = z.infer<typeof articleFormSchema>;

// País, Estado e Cidade schemas
export const countries = pgTable("countries", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull(),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
  updatedAt: text("updated_at").notNull().default(new Date().toISOString()),
});

export const insertCountrySchema = createInsertSchema(countries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const states = pgTable("states", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull(),
  countryId: integer("country_id").notNull(),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
  updatedAt: text("updated_at").notNull().default(new Date().toISOString()),
});

export const insertStateSchema = createInsertSchema(states).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const cities = pgTable("cities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  stateId: integer("state_id").notNull(),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
  updatedAt: text("updated_at").notNull().default(new Date().toISOString()),
});

export const insertCitySchema = createInsertSchema(cities).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Country = typeof countries.$inferSelect;
export type InsertCountry = z.infer<typeof insertCountrySchema>;

export type State = typeof states.$inferSelect;
export type InsertState = z.infer<typeof insertStateSchema>;

export type City = typeof cities.$inferSelect;
export type InsertCity = z.infer<typeof insertCitySchema>;

// Pages Schema
export const pages = pgTable("pages", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  content: text("content"),
  slug: text("slug").notNull().unique(),
  canonicalUrl: text("canonical_url"),
  imageUrl: text("image_url"),
  imageAlt: text("image_alt"),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  status: text("status", { enum: ["draft", "published", "archived"] }).default("draft").notNull(),
  publishedAt: text("published_at"),
  updatedAt: text("updated_at").notNull().default(new Date().toISOString()),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
  createdBy: integer("created_by").references(() => users.id),
  updatedBy: integer("updated_by").references(() => users.id),
});

export const insertPageSchema = createInsertSchema(pages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const pageFormSchema = insertPageSchema.extend({
  image: z.any().optional(),
});

// Schema para configuração SEO
export const pageSeoSchema = z.object({
  id: z.number().optional(),
  pageId: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  canonical: z.string().nullable(),
  og: z.object({
    title: z.string().nullable(),
    description: z.string().nullable(),
    url: z.string().nullable(),
    published_time: z.string().nullable(),
    updated_time: z.string().nullable(),
    image: z.object({
      url: z.string().nullable(),
      secure_url: z.string().nullable(),
      alt: z.string().nullable(),
      type: z.string().nullable(),
      width: z.string().nullable(),
      height: z.string().nullable()
    }).nullable(),
    type: z.string().default("website"),
    site_name: z.string().default("Funn Tour"),
    locale: z.string().default("pt_BR")
  }).nullable(),
  twitter: z.object({
    title: z.string().nullable(),
    description: z.string().nullable(),
    image: z.string().nullable(),
    card: z.string().default("summary_large_image"),
    label1: z.string().nullable(),
    data1: z.string().nullable()
  }).nullable(),
  robots: z.string().nullable(),
  schema: z.string().nullable(),
  article: z.object({
    publisher: z.array(z.string()).nullable()
  }).nullable()
});

export type Page = typeof pages.$inferSelect;
export type InsertPage = z.infer<typeof insertPageSchema>;
export type PageFormValues = z.infer<typeof pageFormSchema>;
export type PageSeo = z.infer<typeof pageSeoSchema>;

// Roteiros schema - Nova funcionalidade
export const itineraries = pgTable("itineraries", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  observations: text("observations"),
  partnerId: integer("partner_id").references(() => users.id),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
  updatedAt: text("updated_at").notNull().default(new Date().toISOString()),
});

export const insertItinerarySchema = createInsertSchema(itineraries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const itineraryFormSchema = insertItinerarySchema.extend({
  name: z.string().min(3, "Nome do roteiro deve ter pelo menos 3 caracteres"),
});

export type Itinerary = typeof itineraries.$inferSelect;
export type InsertItinerary = z.infer<typeof insertItinerarySchema>;
export type ItineraryFormValues = z.infer<typeof itineraryFormSchema>;

// Preços de Parceiros schema - Nova funcionalidade
export const pricingTypes = ["hourly", "daily"] as const;
export const dayTypes = ["weekday", "weekend", "holiday"] as const;

export const partnerPrices = pgTable("partner_prices", {
  id: serial("id").primaryKey(),
  partnerId: integer("partner_id").notNull().references(() => users.id),
  boatId: integer("boat_id").notNull().references(() => boats.id),
  pricingType: text("pricing_type", { enum: ["hourly", "daily"] }).notNull(),
  weekdayPrice: integer("weekday_price").notNull(),
  weekendPrice: integer("weekend_price").notNull(),
  holidayPrice: integer("holiday_price").notNull(),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
  updatedAt: text("updated_at").notNull().default(new Date().toISOString()),
});

export const insertPartnerPriceSchema = createInsertSchema(partnerPrices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const partnerPriceFormSchema = insertPartnerPriceSchema.extend({
  weekdayPrice: z.number().min(0, "O preço não pode ser negativo"),
  weekendPrice: z.number().min(0, "O preço não pode ser negativo"),
  holidayPrice: z.number().min(0, "O preço não pode ser negativo"),
});

export type PartnerPrice = typeof partnerPrices.$inferSelect;
export type InsertPartnerPrice = z.infer<typeof insertPartnerPriceSchema>;
export type PartnerPriceFormValues = z.infer<typeof partnerPriceFormSchema>;
