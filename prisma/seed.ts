import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

export interface CatalogRecord {
  catalogId: string;
  category: string;
  product: string;
  manufacturer: string;
  priceINR: number;
  sourceUrl: string;
  photoStatus: string;
}

export const CATALOG_DATA: CatalogRecord[] = [
  // Page 1 (SIN-HERO-001 to 008)
  { catalogId: "SIN-HERO-001", category: "Kitchen", product: "Stainless Steel Water Bottle", manufacturer: "Chengdu Haizhuobote Technology Co., Ltd.", priceINR: 175.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Stainless%20Steel%20Water%20Bottle", photoStatus: "Embedded real photo" },
  { catalogId: "SIN-HERO-002", category: "Kitchen", product: "Vacuum Insulated Tumbler", manufacturer: "Sichuan Huadun", priceINR: 145.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Vacuum%20Insulated%20Tumbler", photoStatus: "Embedded real photo" },
  { catalogId: "SIN-HERO-003", category: "Kitchen", product: "Lunch Box", manufacturer: "Ningbo Joyoung Appliance", priceINR: 260.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Lunch%20Box", photoStatus: "Embedded real photo" },
  { catalogId: "SIN-HERO-004", category: "Kitchen", product: "Airtight Food Container", manufacturer: "Taizhou Yongjiang Technology", priceINR: 135.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Airtight%20Food%20Container", photoStatus: "Embedded real photo" },
  { catalogId: "SIN-HERO-005", category: "Kitchen", product: "Silicone Kitchen Utensil Set", manufacturer: "Yiwu Kitchen Products", priceINR: 220.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Silicone%20Kitchen%20Utensil%20Set", photoStatus: "Embedded real photo" },
  { catalogId: "SIN-HERO-006", category: "Kitchen", product: "Cutting Board", manufacturer: "Ningbo Houseware Supplier", priceINR: 160.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Cutting%20Board", photoStatus: "Embedded real photo" },
  { catalogId: "SIN-HERO-007", category: "Kitchen", product: "Kitchen Organizer", manufacturer: "Yiwu Houseware Supplier", priceINR: 180.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Kitchen%20Organizer", photoStatus: "Embedded real photo" },
  { catalogId: "SIN-HERO-008", category: "Kitchen", product: "Spice Rack", manufacturer: "Ningbo Kitchen Products", priceINR: 280.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Spice%20Rack", photoStatus: "Embedded real photo" },

  // Page 2 (SIN-HERO-009 to 016)
  { catalogId: "SIN-HERO-009", category: "Kitchen", product: "Dish Drying Rack", manufacturer: "Zhejiang Houseware Supplier", priceINR: 390.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Dish%20Drying%20Rack", photoStatus: "Embedded real photo" },
  { catalogId: "SIN-HERO-010", category: "Kitchen", product: "Reusable Food Storage Bag", manufacturer: "Zhejiang Kitchen Supplier", priceINR: 95.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Reusable%20Food%20Storage%20Bag", photoStatus: "Embedded real photo" },
  { catalogId: "SIN-HERO-011", category: "Storage", product: "Plastic Storage Box", manufacturer: "Hebei Duoli", priceINR: 210.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Plastic%20Storage%20Box", photoStatus: "Embedded real photo" },
  { catalogId: "SIN-HERO-012", category: "Storage", product: "Drawer Organizer", manufacturer: "Dongguan Junxian", priceINR: 160.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Drawer%20Organizer", photoStatus: "Embedded real photo" },
  { catalogId: "SIN-HERO-013", category: "Storage", product: "Wardrobe Organizer", manufacturer: "Dongguan Junxian", priceINR: 175.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Wardrobe%20Organizer", photoStatus: "Embedded real photo" },
  { catalogId: "SIN-HERO-014", category: "Storage", product: "Shoe Organizer", manufacturer: "Yiwu Storage Products", priceINR: 190.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Shoe%20Organizer", photoStatus: "Embedded real photo" },
  { catalogId: "SIN-HERO-015", category: "Storage", product: "Laundry Basket", manufacturer: "Zhejiang Yimei", priceINR: 250.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Laundry%20Basket", photoStatus: "Embedded real photo" },
  { catalogId: "SIN-HERO-016", category: "Storage", product: "Under-Bed Storage Box", manufacturer: "Yiwu Storage Products", priceINR: 320.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Under-Bed%20Storage%20Box", photoStatus: "Embedded real photo" },

  // Page 3 (SIN-HERO-017 to 024)
  { catalogId: "SIN-HERO-017", category: "Storage", product: "Kitchen Storage Container", manufacturer: "Zhejiang Yimei", priceINR: 145.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Kitchen%20Storage%20Container", photoStatus: "Embedded real photo" },
  { catalogId: "SIN-HERO-018", category: "Storage", product: "Bathroom Organizer", manufacturer: "Yiwu Houseware", priceINR: 170.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Bathroom%20Organizer", photoStatus: "Embedded real photo" },
  { catalogId: "SIN-HERO-019", category: "Storage", product: "Foldable Storage Basket", manufacturer: "Zhejiang Yimei", priceINR: 135.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Foldable%20Storage%20Basket", photoStatus: "Embedded real photo" },
  { catalogId: "SIN-HERO-020", category: "Storage", product: "Multipurpose Storage Rack", manufacturer: "Ningbo Storage Supplier", priceINR: 450.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Multipurpose%20Storage%20Rack", photoStatus: "Embedded real photo" },
  { catalogId: "SIN-HERO-021", category: "Cleaning", product: "Microfiber Cleaning Cloth", manufacturer: "Jiashan Boyuan", priceINR: 35.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Microfiber%20Cleaning%20Cloth", photoStatus: "Embedded real photo" },
  { catalogId: "SIN-HERO-022", category: "Cleaning", product: "Spin Mop", manufacturer: "Ningbo Cleaning Products", priceINR: 420.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Spin%20Mop", photoStatus: "Embedded real photo" },
  { catalogId: "SIN-HERO-023", category: "Cleaning", product: "Floor Mop", manufacturer: "Zhejiang Cleaning Supplier", priceINR: 250.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Floor%20Mop", photoStatus: "Embedded real photo" },
  { catalogId: "SIN-HERO-024", category: "Cleaning", product: "Cleaning Brush Set", manufacturer: "Yiwu Cleaning Products", priceINR: 110.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Cleaning%20Brush%20Set", photoStatus: "Embedded real photo" },

  // Page 4 (SIN-HERO-025 to 032)
  { catalogId: "SIN-HERO-025", category: "Cleaning", product: "Dish Scrubber", manufacturer: "Hangzhou Joyplus", priceINR: 25.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Dish%20Scrubber", photoStatus: "Embedded real photo" },
  { catalogId: "SIN-HERO-026", category: "Cleaning", product: "Spray Bottle", manufacturer: "Yiwu Cleaning Products", priceINR: 55.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Spray%20Bottle", photoStatus: "No suitable real photo embedded" },
  { catalogId: "SIN-HERO-027", category: "Cleaning", product: "Window Cleaning Tool", manufacturer: "Zhejiang Cleaning Supplier", priceINR: 140.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Window%20Cleaning%20Tool", photoStatus: "No suitable real photo embedded" },
  { catalogId: "SIN-HERO-028", category: "Cleaning", product: "Dustpan & Brush", manufacturer: "Ningbo Houseware", priceINR: 110.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Dustpan%20%26%20Brush", photoStatus: "Embedded real photo" },
  { catalogId: "SIN-HERO-029", category: "Cleaning", product: "Sponge Cloth", manufacturer: "Guangzhou Hasen", priceINR: 28.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Sponge%20Cloth", photoStatus: "No suitable real photo embedded" },
  { catalogId: "SIN-HERO-030", category: "Cleaning", product: "Toilet Cleaning Brush", manufacturer: "Yiwu Cleaning Products", priceINR: 90.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Toilet%20Cleaning%20Brush", photoStatus: "No suitable real photo embedded" },
  { catalogId: "SIN-HERO-031", category: "Home Décor", product: "Decorative Ceramic Vase", manufacturer: "Jingdezhen Shengjiang Ceramics", priceINR: 650.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Decorative%20Ceramic%20Vase", photoStatus: "Embedded real photo" },
  { catalogId: "SIN-HERO-032", category: "Home Décor", product: "Glass Flower Vase", manufacturer: "Fuzhou Homechoice", priceINR: 700.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Glass%20Flower%20Vase", photoStatus: "Embedded real photo" },

  // Page 5 (SIN-HERO-033 to 040)
  { catalogId: "SIN-HERO-033", category: "Home Décor", product: "Rattan Decorative Basket", manufacturer: "Fuzhou Homechoice", priceINR: 1200.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Rattan%20Decorative%20Basket", photoStatus: "Embedded real photo" },
  { catalogId: "SIN-HERO-034", category: "Home Décor", product: "Decorative Wall Art", manufacturer: "Dongguan Aoai", priceINR: 900.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Decorative%20Wall%20Art", photoStatus: "Embedded real photo" },
  { catalogId: "SIN-HERO-035", category: "Home Décor", product: "Ceramic Planter", manufacturer: "Chaozhou Dabao Ceramics", priceINR: 750.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Ceramic%20Planter", photoStatus: "Embedded real photo" },
  { catalogId: "SIN-HERO-036", category: "Home Décor", product: "Candle Holder", manufacturer: "Chaozhou Color Shape", priceINR: 350.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Candle%20Holder", photoStatus: "Embedded real photo" },
  { catalogId: "SIN-HERO-037", category: "Home Décor", product: "Decorative Tray", manufacturer: "Jiangmen Weilaishang", priceINR: 850.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Decorative%20Tray", photoStatus: "Embedded real photo" },
  { catalogId: "SIN-HERO-038", category: "Home Décor", product: "Resin Sculpture", manufacturer: "Dongguan Aoai", priceINR: 1500.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Resin%20Sculpture", photoStatus: "Embedded real photo" },
  { catalogId: "SIN-HERO-039", category: "Home Décor", product: "Decorative Bottle", manufacturer: "Shenzhen Tianbao", priceINR: 600.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Decorative%20Bottle", photoStatus: "Embedded real photo" },
  { catalogId: "SIN-HERO-040", category: "Home Décor", product: "Decorative Bowl", manufacturer: "Shenzhen Dwax", priceINR: 550.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Decorative%20Bowl", photoStatus: "Embedded real photo" },

  // Page 6 (SIN-HERO-041 to 048)
  { catalogId: "SIN-HERO-041", category: "Household", product: "Plastic Waste Bin", manufacturer: "Jieyang Hongxing", priceINR: 55.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Plastic%20Waste%20Bin", photoStatus: "No suitable real photo embedded" },
  { catalogId: "SIN-HERO-042", category: "Household", product: "Household Bucket", manufacturer: "Zhejiang Yimei", priceINR: 120.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Household%20Bucket", photoStatus: "No suitable real photo embedded" },
  { catalogId: "SIN-HERO-043", category: "Household", product: "Laundry Basket", manufacturer: "Zhejiang Yimei", priceINR: 250.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Laundry%20Basket", photoStatus: "Embedded real photo" },
  { catalogId: "SIN-HERO-044", category: "Household", product: "Household Storage Basket", manufacturer: "Hebei Duoli", priceINR: 210.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Household%20Storage%20Basket", photoStatus: "No suitable real photo embedded" },
  { catalogId: "SIN-HERO-045", category: "Household", product: "Cleaning Towel", manufacturer: "Jiashan Boyuan", priceINR: 35.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Cleaning%20Towel", photoStatus: "Embedded real photo" },
  { catalogId: "SIN-HERO-046", category: "Household", product: "Food Storage Container", manufacturer: "Taizhou Yongjiang", priceINR: 135.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Food%20Storage%20Container", photoStatus: "No suitable real photo embedded" },
  { catalogId: "SIN-HERO-047", category: "Household", product: "Household Sponge", manufacturer: "Guangzhou Hasen", priceINR: 25.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Household%20Sponge", photoStatus: "Embedded real photo" },
  { catalogId: "SIN-HERO-048", category: "Household", product: "Dish Brush", manufacturer: "Hangzhou Joyplus", priceINR: 35.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Dish%20Brush", photoStatus: "Embedded real photo" },

  // Page 7 (SIN-HERO-049 to 056)
  { catalogId: "SIN-HERO-049", category: "Household", product: "Multipurpose Household Container", manufacturer: "Hebei Duoli", priceINR: 180.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Multipurpose%20Household%20Container", photoStatus: "No suitable real photo embedded" },
  { catalogId: "SIN-HERO-050", category: "Household", product: "Household Cleaning Cloth", manufacturer: "Dandong Jinyang", priceINR: 30.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Household%20Cleaning%20Cloth", photoStatus: "Embedded real photo" },
  { catalogId: "SIN-HERO-051", category: "Lighting", product: "Rechargeable LED Table Lamp", manufacturer: "Jianbian Lighting", priceINR: 307.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Rechargeable%20LED%20Table%20Lamp", photoStatus: "No suitable real photo embedded" },
  { catalogId: "SIN-HERO-052", category: "Lighting", product: "Rattan Rechargeable Lamp", manufacturer: "Zhongshan Rebecca Lighting", priceINR: 1743.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Rattan%20Rechargeable%20Lamp", photoStatus: "No suitable real photo embedded" },
  { catalogId: "SIN-HERO-053", category: "Lighting", product: "Crystal Table Lamp", manufacturer: "Jiangmen Honghui Lighting", priceINR: 445.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Crystal%20Table%20Lamp", photoStatus: "No suitable real photo embedded" },
  { catalogId: "SIN-HERO-054", category: "Lighting", product: "Cordless Restaurant Lamp", manufacturer: "Zhongshan Huatian", priceINR: 250.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Cordless%20Restaurant%20Lamp", photoStatus: "No suitable real photo embedded" },
  { catalogId: "SIN-HERO-055", category: "Lighting", product: "Rechargeable Bedside Lamp", manufacturer: "Zhongshan Qianyi", priceINR: 1450.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Rechargeable%20Bedside%20Lamp", photoStatus: "No suitable real photo embedded" },
  { catalogId: "SIN-HERO-056", category: "Lighting", product: "LED Desk Lamp", manufacturer: "Guangzhou Canmei", priceINR: 800.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=LED%20Desk%20Lamp", photoStatus: "No suitable real photo embedded" },

  // Page 8 (SIN-HERO-057 to 064)
  { catalogId: "SIN-HERO-057", category: "Lighting", product: "Hotel Table Lamp", manufacturer: "Zhongshan Digui", priceINR: 480.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Hotel%20Table%20Lamp", photoStatus: "No suitable real photo embedded" },
  { catalogId: "SIN-HERO-058", category: "Lighting", product: "Crystal Decorative Lamp", manufacturer: "Zhongshan Xiongjiu", priceINR: 1650.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Crystal%20Decorative%20Lamp", photoStatus: "No suitable real photo embedded" },
  { catalogId: "SIN-HERO-059", category: "Lighting", product: "Pendant Lamp", manufacturer: "Zhongshan Rebecca", priceINR: 1750.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Pendant%20Lamp", photoStatus: "No suitable real photo embedded" },
  { catalogId: "SIN-HERO-060", category: "Lighting", product: "Portable Outdoor Lamp", manufacturer: "Ningbo Everstar", priceINR: 310.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Portable%20Outdoor%20Lamp", photoStatus: "No suitable real photo embedded" },
  { catalogId: "SIN-HERO-061", category: "Hardware", product: "Cabinet Handle", manufacturer: "Wenzhou Oukali", priceINR: 32.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Cabinet%20Handle", photoStatus: "No suitable real photo embedded" },
  { catalogId: "SIN-HERO-062", category: "Hardware", product: "Cabinet Hinge", manufacturer: "Guangdong Topcent", priceINR: 18.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Cabinet%20Hinge", photoStatus: "No suitable real photo embedded" },
  { catalogId: "SIN-HERO-063", category: "Hardware", product: "Soft Close Hinge", manufacturer: "Guangdong Kav", priceINR: 44.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Soft%20Close%20Hinge", photoStatus: "No suitable real photo embedded" },
  { catalogId: "SIN-HERO-064", category: "Hardware", product: "Recessed Cabinet Handle", manufacturer: "Jiangmen Yako", priceINR: 84.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Recessed%20Cabinet%20Handle", photoStatus: "No suitable real photo embedded" },

  // Page 9 (SIN-HERO-065 to 072)
  { catalogId: "SIN-HERO-065", category: "Hardware", product: "Drawer Pull", manufacturer: "Wenzhou Milan", priceINR: 70.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Drawer%20Pull", photoStatus: "No suitable real photo embedded" },
  { catalogId: "SIN-HERO-066", category: "Hardware", product: "Cabinet Knob", manufacturer: "Qingyuan Consun", priceINR: 70.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Cabinet%20Knob", photoStatus: "No suitable real photo embedded" },
  { catalogId: "SIN-HERO-067", category: "Hardware", product: "Door Handle", manufacturer: "MVM Hardware", priceINR: 440.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Door%20Handle", photoStatus: "No suitable real photo embedded" },
  { catalogId: "SIN-HERO-068", category: "Hardware", product: "Door Hinge", manufacturer: "MVM Hardware", priceINR: 110.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Door%20Hinge", photoStatus: "No suitable real photo embedded" },
  { catalogId: "SIN-HERO-069", category: "Hardware", product: "Door Lock Body", manufacturer: "MVM Hardware", priceINR: 290.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Door%20Lock%20Body", photoStatus: "No suitable real photo embedded" },
  { catalogId: "SIN-HERO-070", category: "Hardware", product: "Door Stopper", manufacturer: "MVM Hardware", priceINR: 110.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Door%20Stopper", photoStatus: "No suitable real photo embedded" },
  { catalogId: "SIN-HERO-071", category: "Packaging", product: "Custom Gift Box", manufacturer: "Shanghai Zhongchen", priceINR: 70.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Custom%20Gift%20Box", photoStatus: "No suitable real photo embedded" },
  { catalogId: "SIN-HERO-072", category: "Packaging", product: "Corrugated Shipping Box", manufacturer: "Shanghai Forests", priceINR: 55.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Corrugated%20Shipping%20Box", photoStatus: "No suitable real photo embedded" },

  // Page 10 (SIN-HERO-073 to 080)
  { catalogId: "SIN-HERO-073", category: "Packaging", product: "Paper Shopping Bag", manufacturer: "Shanghai Zhongchen", priceINR: 25.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Paper%20Shopping%20Bag", photoStatus: "No suitable real photo embedded" },
  { catalogId: "SIN-HERO-074", category: "Packaging", product: "Cosmetic Packaging Box", manufacturer: "Shenzhen Dongbo", priceINR: 55.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Cosmetic%20Packaging%20Box", photoStatus: "No suitable real photo embedded" },
  { catalogId: "SIN-HERO-075", category: "Packaging", product: "Paper Tube", manufacturer: "Shenzhen Pack", priceINR: 40.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Paper%20Tube", photoStatus: "No suitable real photo embedded" },
  { catalogId: "SIN-HERO-076", category: "Packaging", product: "PET Clear Box", manufacturer: "Jiangmen Ruiding", priceINR: 28.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=PET%20Clear%20Box", photoStatus: "No suitable real photo embedded" },
  { catalogId: "SIN-HERO-077", category: "Packaging", product: "Blister Packaging", manufacturer: "Guangzhou Gianthand", priceINR: 20.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Blister%20Packaging", photoStatus: "No suitable real photo embedded" },
  { catalogId: "SIN-HERO-078", category: "Packaging", product: "Luxury Gift Box", manufacturer: "Guangzhou Jinguan", priceINR: 85.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Luxury%20Gift%20Box", photoStatus: "No suitable real photo embedded" },
  { catalogId: "SIN-HERO-079", category: "Packaging", product: "Mailing Bag", manufacturer: "Shenzhen Xinsheng", priceINR: 5.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Mailing%20Bag", photoStatus: "No suitable real photo embedded" },
  { catalogId: "SIN-HERO-080", category: "Packaging", product: "Food Packaging Pouch", manufacturer: "Hebei Shine Tone", priceINR: 4.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Food%20Packaging%20Pouch", photoStatus: "No suitable real photo embedded" },

  // Page 11 (SIN-HERO-081 to 088)
  { catalogId: "SIN-HERO-081", category: "Office", product: "Ballpoint Pen", manufacturer: "Ningbo Beifa Stationery", priceINR: 12.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Ballpoint%20Pen", photoStatus: "No suitable real photo embedded" },
  { catalogId: "SIN-HERO-082", category: "Office", product: "Metal Promotional Pen", manufacturer: "Yiwu Yixin", priceINR: 14.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Metal%20Promotional%20Pen", photoStatus: "No suitable real photo embedded" },
  { catalogId: "SIN-HERO-083", category: "Office", product: "Notebook", manufacturer: "Ningbo Beifa", priceINR: 90.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Notebook", photoStatus: "No suitable real photo embedded" },
  { catalogId: "SIN-HERO-084", category: "Office", product: "Desk Organizer", manufacturer: "Ningbo Deli", priceINR: 160.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Desk%20Organizer", photoStatus: "No suitable real photo embedded" },
  { catalogId: "SIN-HERO-085", category: "Office", product: "Stapler", manufacturer: "Ningbo Deli", priceINR: 85.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Stapler", photoStatus: "No suitable real photo embedded" },
  { catalogId: "SIN-HERO-086", category: "Office", product: "File Folder", manufacturer: "Guangdong Comix", priceINR: 45.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=File%20Folder", photoStatus: "No suitable real photo embedded" },
  { catalogId: "SIN-HERO-087", category: "Office", product: "Planner", manufacturer: "Zhejiang Sunwood", priceINR: 110.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Planner", photoStatus: "No suitable real photo embedded" },
  { catalogId: "SIN-HERO-088", category: "Office", product: "Highlighter Set", manufacturer: "Ningbo Beilun Yanyan", priceINR: 25.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Highlighter%20Set", photoStatus: "No suitable real photo embedded" },

  // Page 12 (SIN-HERO-089 to 096)
  { catalogId: "SIN-HERO-089", category: "Sports", product: "Yoga Mat", manufacturer: "Nantong Ironman Fitness", priceINR: 450.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Yoga%20Mat", photoStatus: "Embedded real photo" },
  { catalogId: "SIN-HERO-090", category: "Sports", product: "Resistance Band Set", manufacturer: "Yiwu Sports Products", priceINR: 350.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Resistance%20Band%20Set", photoStatus: "Embedded real photo" },
  { catalogId: "SIN-HERO-091", category: "Sports", product: "Dumbbell", manufacturer: "Nantong Ironman Fitness", priceINR: 650.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Dumbbell", photoStatus: "Embedded real photo" },
  { catalogId: "SIN-HERO-092", category: "Sports", product: "Jump Rope", manufacturer: "Yiwu Sports Products", priceINR: 110.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Jump%20Rope", photoStatus: "Embedded real photo" },
  { catalogId: "SIN-HERO-093", category: "Sports", product: "Gym Bag", manufacturer: "Guangzhou Fitness Equipment", priceINR: 500.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Gym%20Bag", photoStatus: "Embedded real photo" },
  { catalogId: "SIN-HERO-094", category: "Sports", product: "Sports Bottle", manufacturer: "Ningbo Fitness Goods", priceINR: 180.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Sports%20Bottle", photoStatus: "Embedded real photo" },
  { catalogId: "SIN-HERO-095", category: "Electronics", product: "Bluetooth Speaker", manufacturer: "Shenzhen Edifier Technology", priceINR: 1200.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Bluetooth%20Speaker", photoStatus: "Embedded real photo" },
  { catalogId: "SIN-HERO-096", category: "Electronics", product: "Power Bank", manufacturer: "Shenzhen Baseus Technology", priceINR: 1450.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Power%20Bank", photoStatus: "Embedded real photo" },

  // Page 13 (SIN-HERO-097 to 100)
  { catalogId: "SIN-HERO-097", category: "Electronics", product: "Wireless Charger", manufacturer: "Shenzhen Ugreen Technology", priceINR: 800.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Wireless%20Charger", photoStatus: "Embedded real photo" },
  { catalogId: "SIN-HERO-098", category: "Electronics", product: "USB Hub", manufacturer: "Shenzhen Orico Technology", priceINR: 700.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=USB%20Hub", photoStatus: "Embedded real photo" },
  { catalogId: "SIN-HERO-099", category: "Electronics", product: "TWS Earbuds", manufacturer: "Shenzhen QCY Technology", priceINR: 900.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=TWS%20Earbuds", photoStatus: "Embedded real photo" },
  { catalogId: "SIN-HERO-100", category: "Electronics", product: "Smartwatch", manufacturer: "Shenzhen Haylou Technology", priceINR: 1800.00, sourceUrl: "https://www.alibaba.com/trade/search?SearchText=Smartwatch", photoStatus: "Embedded real photo" },
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function importPdfCatalog() {
  console.log(`Starting import of ${CATALOG_DATA.length} catalog records...`);

  let categoriesCount = 0;
  let manufacturersCount = 0;
  let productsCount = 0;

  for (const item of CATALOG_DATA) {
    // 1. Upsert Category
    const categorySlug = slugify(item.category);
    const category = await prisma.category.upsert({
      where: { slug: categorySlug },
      update: { name: item.category },
      create: {
        name: item.category,
        slug: categorySlug,
      },
    });

    // 2. Upsert Manufacturer (exact source string preserved)
    const manufacturer = await prisma.manufacturer.upsert({
      where: { name: item.manufacturer },
      update: {},
      create: {
        name: item.manufacturer,
        country: "China",
      },
    });

    // 3. Upsert Product (using catalogId as primary unique identity, moq and leadTimeDays remain null)
    await prisma.product.upsert({
      where: { catalogId: item.catalogId },
      update: {
        name: item.product,
        manufacturerId: manufacturer.id,
        categoryId: category.id,
        unitPriceINR: item.priceINR,
        sourceUrl: item.sourceUrl,
        photoStatus: item.photoStatus,
      },
      create: {
        catalogId: item.catalogId,
        name: item.product,
        manufacturerId: manufacturer.id,
        categoryId: category.id,
        unitPriceINR: item.priceINR,
        sourceUrl: item.sourceUrl,
        photoStatus: item.photoStatus,
        moq: null,
        leadTimeDays: null,
      },
    });

    productsCount++;
  }

  categoriesCount = await prisma.category.count();
  manufacturersCount = await prisma.manufacturer.count();

  console.log(`Import Complete!`);
  console.log(`- Categories in DB: ${categoriesCount}`);
  console.log(`- Manufacturers in DB: ${manufacturersCount}`);
  console.log(`- Products in DB: ${productsCount}`);

  return { categoriesCount, manufacturersCount, productsCount };
}

export async function seedDemoSuppliers() {
  console.log("Seeding Demo Supplier Accounts...");
  const passwordHash = await hash("Password123!", 12);

  const m1 = await prisma.manufacturer.findUnique({
    where: { name: "Chengdu Haizhuobote Technology Co., Ltd." },
  });

  const m2 = await prisma.manufacturer.findUnique({
    where: { name: "Ningbo Joyoung Appliance" },
  });

  const m3 = await prisma.manufacturer.findUnique({
    where: { name: "Sichuan Huadun" },
  });

  if (m1) {
    await prisma.user.upsert({
      where: { email: "supplier.chengdu@sinova.demo" },
      update: {
        name: "Chengdu Haizhuobote (Demo Supplier)",
        passwordHash,
        role: "SUPPLIER",
        manufacturerId: m1.id,
      },
      create: {
        email: "supplier.chengdu@sinova.demo",
        name: "Chengdu Haizhuobote (Demo Supplier)",
        passwordHash,
        role: "SUPPLIER",
        manufacturerId: m1.id,
      },
    });
    console.log(`- Seeded Demo Supplier 1: supplier.chengdu@sinova.demo -> ${m1.name}`);
  }

  if (m2) {
    await prisma.user.upsert({
      where: { email: "supplier.joyoung@sinova.demo" },
      update: {
        name: "Ningbo Joyoung (Demo Supplier)",
        passwordHash,
        role: "SUPPLIER",
        manufacturerId: m2.id,
      },
      create: {
        email: "supplier.joyoung@sinova.demo",
        name: "Ningbo Joyoung (Demo Supplier)",
        passwordHash,
        role: "SUPPLIER",
        manufacturerId: m2.id,
      },
    });
    console.log(`- Seeded Demo Supplier 2: supplier.joyoung@sinova.demo -> ${m2.name}`);
  }

  if (m3) {
    await prisma.user.upsert({
      where: { email: "supplier.huadun@sinova.demo" },
      update: {
        name: "Sichuan Huadun (Demo Supplier)",
        passwordHash,
        role: "SUPPLIER",
        manufacturerId: m3.id,
      },
      create: {
        email: "supplier.huadun@sinova.demo",
        name: "Sichuan Huadun (Demo Supplier)",
        passwordHash,
        role: "SUPPLIER",
        manufacturerId: m3.id,
      },
    });
    console.log(`- Seeded Demo Supplier 3: supplier.huadun@sinova.demo -> ${m3.name}`);
  }
}

async function main() {
  await importPdfCatalog();
  await seedDemoSuppliers();
}

if (require.main === module) {
  main()
    .catch((e) => {
      console.error("Catalog import error:", e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
