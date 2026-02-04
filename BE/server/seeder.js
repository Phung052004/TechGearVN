/* file: server/seeder.js */
require("dotenv").config({ path: require("path").join(__dirname, ".env") });

const mongoose = require("mongoose");
const slugify = require("slugify");

const connectDB = require("./config/db");

const Product = require("./models/Product");
const ProductSpec = require("./models/ProductSpec");
const Category = require("./models/Category");
const Supplier = require("./models/Supplier");

// Image links provided by user (rotate/reuse across products)
const SEED_IMAGES = {
  keyboard:
    "https://ttgshop.vn/media/product/250_1054768145_dsc02865_feb8b65a121548bd9dd67bb2d58c2147.jpg",
  vga: "https://ttgshop.vn/media/product/250_1071539305_vga_zotac_gaming_geforce_rtx_5060_twin_edge_1_b196753399e64fc6a3f9e6e601fa1293.jpg",
  cpu: "https://ttgshop.vn/media/product/250_1066944459_cpu_i5_12400f_tray_88463acacaae4eae9a81b1a6f9f048ab.jpg",
  ram: "https://ttgshop.vn/media/product/250_1069162996_ram_geil_spear_v_16gb_buss_5200mhz_ddr5_black_1_c94fa95bbca64fceb937ba94f1c8a406.jpg",
  chairBlack:
    "https://ttgshop.vn/media/product/1068929666_ghe_gaming_andaseat_novis_black_pvc__592fd9acec5d48b79054ddd7df33dc45.png",
  chairGrey:
    "https://ttgshop.vn/media/product/250_1068929560_ghe_gaming_andaseat_novis_grey_fabric_11_f8ea3fbe8e0142279328600cb419a16b.png",
  headset:
    "https://ttgshop.vn/media/product/250_1071494272_tai_nghe_asus_tuf_h1_gen_ii_usb_hatsune_miku_edition_6_6f470bb6df10439fb83fcb90283bc09b.jpg",
  mouse:
    "https://ttgshop.vn/media/product/250_1068873576_chuot_gaming_logitech_g_pro_x_superligh_1_95427d7e64594dafa38f91e6dd8351a7.jpg",
};

const toSlug = (value) =>
  slugify(String(value), { lower: true, strict: true, trim: true });

const seedData = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.warn(
        "⚠️  MONGO_URI is missing. Using fallback mongodb://localhost:27017/TechGearDB",
      );
      process.env.MONGO_URI = "mongodb://localhost:27017/TechGearDB";
    }

    await connectDB();
    console.log("✅ Connected DB");

    // Xóa sạch dữ liệu cũ
    await Product.deleteMany({});
    await ProductSpec.deleteMany({});
    await Category.deleteMany({});
    await Supplier.deleteMany({});
    console.log("🧹 Đã dọn dẹp dữ liệu cũ...");

    // Seed Suppliers
    const suppliersToCreate = [
      {
        name: "TechGear Distribution",
        contactPerson: "Nguyễn Văn A",
        phone: "0900000001",
        email: "contact@techgear-distribution.vn",
        address: "Hà Nội",
      },
      {
        name: "VietParts Supplier",
        contactPerson: "Trần Thị B",
        phone: "0900000002",
        email: "sales@vietparts.vn",
        address: "TP. Hồ Chí Minh",
      },
      {
        name: "PC Hub Wholesale",
        contactPerson: "Lê Văn C",
        phone: "0900000003",
        email: "support@pchub.vn",
        address: "Đà Nẵng",
      },
    ];
    await Supplier.insertMany(suppliersToCreate);
    console.log("✅ Đã tạo Suppliers");

    // A. TẠO CATEGORIES
    const categoriesToCreate = [
      "CPU",
      "Mainboard",
      "VGA",
      "RAM",
      "SSD",
      "HDD",
      "PSU",
      "Case",
      "Tản nhiệt",
      "Quạt case",
      "Màn hình",
      "Bàn phím",
      "Chuột",
      "Lót chuột",
      "Tai nghe",
      "Ghế gaming",
    ].map((name) => ({ name, slug: toSlug(name), parent: null }));

    const cats = await Category.insertMany(categoriesToCreate);

    const catId = Object.fromEntries(
      cats
        .map((c) => [String(c.slug), c._id])
        .filter(([slug, id]) => slug && id),
    );

    console.log("✅ Đã tạo Categories");

    // B. TẠO PRODUCT & SPECS
    const productsData = [
      {
        // 1. CPU
        product: {
          name: "Intel Core i5-12400F (Tray)",
          slug: "intel-core-i5-12400f-tray",
          sku: "CPU-INTEL-12400F-TRAY",
          price: 3190000,
          originalPrice: 3590000,
          stockQuantity: 40,
          category: catId["cpu"],
          thumbnail: SEED_IMAGES.cpu,
          description:
            "CPU Intel i5 12400F hiệu năng/giá tốt cho gaming 1080p.",
          status: "ACTIVE",
        },
        specs: [
          { specKey: "Socket", specValue: "LGA1700" },
          { specKey: "Số nhân", specValue: "6" },
          { specKey: "Số luồng", specValue: "12" },
          { specKey: "iGPU", specValue: "Không" },
        ],
      },
      {
        // CPU 2
        product: {
          name: "Intel Core i7-12700F",
          slug: "intel-core-i7-12700f",
          sku: "CPU-INTEL-12700F",
          price: 5890000,
          originalPrice: 6490000,
          stockQuantity: 18,
          category: catId["cpu"],
          thumbnail: SEED_IMAGES.cpu,
          description:
            "CPU i7 12700F đa nhiệm mạnh, phù hợp gaming + streaming.",
          status: "ACTIVE",
        },
        specs: [
          { specKey: "Socket", specValue: "LGA1700" },
          { specKey: "Số nhân", specValue: "12" },
          { specKey: "Số luồng", specValue: "20" },
          { specKey: "iGPU", specValue: "Không" },
        ],
      },
      {
        // CPU 3
        product: {
          name: "AMD Ryzen 5 5600",
          slug: "amd-ryzen-5-5600",
          sku: "CPU-AMD-R5-5600",
          price: 2490000,
          originalPrice: 2890000,
          stockQuantity: 22,
          category: catId["cpu"],
          thumbnail: SEED_IMAGES.cpu,
          status: "ACTIVE",
        },
        specs: [
          { specKey: "Socket", specValue: "AM4" },
          { specKey: "Số nhân", specValue: "6" },
          { specKey: "Số luồng", specValue: "12" },
          { specKey: "iGPU", specValue: "Không" },
        ],
      },
      {
        // CPU 4 (out of stock)
        product: {
          name: "AMD Ryzen 7 5800X3D",
          slug: "amd-ryzen-7-5800x3d",
          sku: "CPU-AMD-R7-5800X3D",
          price: 7990000,
          originalPrice: 8590000,
          stockQuantity: 0,
          category: catId["cpu"],
          thumbnail: SEED_IMAGES.cpu,
          status: "ACTIVE",
        },
        specs: [
          { specKey: "Socket", specValue: "AM4" },
          { specKey: "Số nhân", specValue: "8" },
          { specKey: "Số luồng", specValue: "16" },
          { specKey: "3D V-Cache", specValue: "Có" },
        ],
      },
      {
        // 2. Mainboard
        product: {
          name: "MSI MAG B760M MORTAR WIFI",
          slug: "msi-mag-b760m-mortar-wifi",
          sku: "MAIN-MSI-B760M",
          price: 4590000,
          originalPrice: 4900000,
          stockQuantity: 20,
          category: catId["mainboard"],
          thumbnail: SEED_IMAGES.keyboard,
          status: "ACTIVE",
        },
        specs: [
          { specKey: "Socket", specValue: "LGA1700" },
          { specKey: "Chipset", specValue: "B760" },
          { specKey: "Loại RAM", specValue: "DDR5" },
          { specKey: "Kích thước", specValue: "Micro-ATX" },
        ],
      },
      {
        // Mainboard 2
        product: {
          name: "ASUS PRIME B660M-A WIFI D4",
          slug: "asus-prime-b660m-a-wifi-d4",
          sku: "MAIN-ASUS-B660M-D4",
          price: 3190000,
          originalPrice: 3490000,
          stockQuantity: 15,
          category: catId["mainboard"],
          thumbnail: SEED_IMAGES.keyboard,
          status: "ACTIVE",
        },
        specs: [
          { specKey: "Socket", specValue: "LGA1700" },
          { specKey: "Chipset", specValue: "B660" },
          { specKey: "Loại RAM", specValue: "DDR4" },
          { specKey: "WiFi", specValue: "Có" },
        ],
      },
      {
        // Mainboard 3
        product: {
          name: "MSI B550M PRO-VDH WIFI",
          slug: "msi-b550m-pro-vdh-wifi",
          sku: "MAIN-MSI-B550M",
          price: 2490000,
          originalPrice: 2790000,
          stockQuantity: 19,
          category: catId["mainboard"],
          thumbnail: SEED_IMAGES.keyboard,
          status: "ACTIVE",
        },
        specs: [
          { specKey: "Socket", specValue: "AM4" },
          { specKey: "Chipset", specValue: "B550" },
          { specKey: "Loại RAM", specValue: "DDR4" },
          { specKey: "Kích thước", specValue: "Micro-ATX" },
        ],
      },
      {
        // 3. VGA
        product: {
          name: "ZOTAC GAMING GeForce RTX 5060 Twin Edge",
          slug: "zotac-gaming-rtx-5060-twin-edge",
          sku: "VGA-ZOTAC-RTX5060-TE",
          price: 10990000,
          originalPrice: 11990000,
          stockQuantity: 12,
          category: catId["vga"],
          thumbnail: SEED_IMAGES.vga,
          status: "ACTIVE",
        },
        specs: [
          { specKey: "Chipset", specValue: "RTX 5060" },
          { specKey: "Nguồn khuyến nghị", specValue: "650W" },
          { specKey: "Bảo hành", specValue: "36 tháng" },
        ],
      },
      {
        // VGA 2
        product: {
          name: "GeForce RTX 4060 8GB",
          slug: "geforce-rtx-4060-8gb",
          sku: "VGA-RTX4060-8G",
          price: 7490000,
          originalPrice: 7990000,
          stockQuantity: 11,
          category: catId["vga"],
          thumbnail: SEED_IMAGES.vga,
          status: "ACTIVE",
        },
        specs: [
          { specKey: "Chipset", specValue: "RTX 4060" },
          { specKey: "VRAM", specValue: "8GB" },
          { specKey: "Nguồn khuyến nghị", specValue: "550W" },
        ],
      },
      {
        // VGA 3
        product: {
          name: "Radeon RX 7600 8GB",
          slug: "radeon-rx-7600-8gb",
          sku: "VGA-RX7600-8G",
          price: 6990000,
          originalPrice: 7590000,
          stockQuantity: 8,
          category: catId["vga"],
          thumbnail: SEED_IMAGES.vga,
          status: "ACTIVE",
        },
        specs: [
          { specKey: "Chipset", specValue: "RX 7600" },
          { specKey: "VRAM", specValue: "8GB" },
          { specKey: "Nguồn khuyến nghị", specValue: "550W" },
        ],
      },
      {
        // 4. RAM
        product: {
          name: "GeIL Spear V 16GB DDR5 5200MHz (1x16GB)",
          slug: "geil-spear-v-16gb-ddr5-5200",
          sku: "RAM-GEIL-16G-5200",
          price: 1090000,
          originalPrice: 1290000,
          stockQuantity: 60,
          category: catId["ram"],
          thumbnail: SEED_IMAGES.ram,
          status: "ACTIVE",
        },
        specs: [
          { specKey: "Dung lượng", specValue: "16GB" },
          { specKey: "Chuẩn", specValue: "DDR5" },
          { specKey: "Bus", specValue: "5200MHz" },
          { specKey: "Tản nhiệt", specValue: "Có" },
        ],
      },
      {
        // RAM 2
        product: {
          name: "RAM DDR4 16GB 3200MHz (2x8GB)",
          slug: "ram-ddr4-16gb-3200-2x8",
          sku: "RAM-DDR4-16G-3200-2X8",
          price: 890000,
          originalPrice: 1050000,
          stockQuantity: 44,
          category: catId["ram"],
          thumbnail: SEED_IMAGES.ram,
          status: "ACTIVE",
        },
        specs: [
          { specKey: "Dung lượng", specValue: "16GB" },
          { specKey: "Chuẩn", specValue: "DDR4" },
          { specKey: "Bus", specValue: "3200MHz" },
          { specKey: "Kit", specValue: "2x8GB" },
        ],
      },
      {
        // RAM 3
        product: {
          name: "RAM DDR5 32GB 6000MHz (2x16GB)",
          slug: "ram-ddr5-32gb-6000-2x16",
          sku: "RAM-DDR5-32G-6000-2X16",
          price: 2390000,
          originalPrice: 2790000,
          stockQuantity: 16,
          category: catId["ram"],
          thumbnail: SEED_IMAGES.ram,
          status: "ACTIVE",
        },
        specs: [
          { specKey: "Dung lượng", specValue: "32GB" },
          { specKey: "Chuẩn", specValue: "DDR5" },
          { specKey: "Bus", specValue: "6000MHz" },
          { specKey: "Kit", specValue: "2x16GB" },
        ],
      },
      {
        // 5. PSU
        product: {
          name: "Corsair RM850e 850W 80 Plus Gold",
          slug: "corsair-rm850e-850w",
          sku: "PSU-CORSAIR-850W",
          price: 2990000,
          stockQuantity: 30,
          category: catId["psu"],
          thumbnail: SEED_IMAGES.keyboard,
          status: "ACTIVE",
        },
        specs: [
          { specKey: "Công suất", specValue: "850W" },
          { specKey: "Chuẩn", specValue: "80 Plus Gold" },
          { specKey: "Modular", specValue: "Full Modular" },
        ],
      },
      {
        // PSU 2
        product: {
          name: "PSU 650W 80 Plus Bronze",
          slug: "psu-650w-80-plus-bronze",
          sku: "PSU-650W-BRONZE",
          price: 1290000,
          originalPrice: 1490000,
          stockQuantity: 20,
          category: catId["psu"],
          thumbnail: SEED_IMAGES.keyboard,
          status: "ACTIVE",
        },
        specs: [
          { specKey: "Công suất", specValue: "650W" },
          { specKey: "Chuẩn", specValue: "80 Plus Bronze" },
          { specKey: "Modular", specValue: "Non-Modular" },
        ],
      },
      {
        // PSU 3
        product: {
          name: "PSU 750W 80 Plus Gold",
          slug: "psu-750w-80-plus-gold",
          sku: "PSU-750W-GOLD",
          price: 2190000,
          originalPrice: 2390000,
          stockQuantity: 7,
          category: catId["psu"],
          thumbnail: SEED_IMAGES.keyboard,
          status: "ACTIVE",
        },
        specs: [
          { specKey: "Công suất", specValue: "750W" },
          { specKey: "Chuẩn", specValue: "80 Plus Gold" },
          { specKey: "Modular", specValue: "Semi Modular" },
        ],
      },
      {
        // 6. Keyboard
        product: {
          name: "Bàn phím cơ Aula AU75 Golden (3 Mode)",
          slug: "ban-phim-co-aula-au75-golden-3-mode",
          sku: "KB-AULA-AU75",
          price: 1590000,
          originalPrice: 1890000,
          stockQuantity: 25,
          category: catId["ban-phim"],
          thumbnail: SEED_IMAGES.keyboard,
          status: "ACTIVE",
        },
        specs: [
          { specKey: "Kết nối", specValue: "USB / Bluetooth / 2.4G" },
          { specKey: "Layout", specValue: "75%" },
          { specKey: "LED", specValue: "RGB" },
        ],
      },
      {
        // Keyboard 2
        product: {
          name: "Bàn phím cơ 87 phím (TKL) RGB",
          slug: "ban-phim-co-tkl-rgb",
          sku: "KB-TKL-RGB",
          price: 890000,
          originalPrice: 1090000,
          stockQuantity: 30,
          category: catId["ban-phim"],
          thumbnail: SEED_IMAGES.keyboard,
          status: "ACTIVE",
        },
        specs: [
          { specKey: "Layout", specValue: "TKL (87 phím)" },
          { specKey: "LED", specValue: "RGB" },
          { specKey: "Kết nối", specValue: "USB" },
        ],
      },
      {
        // 7. Mouse
        product: {
          name: "Logitech G Pro X Superlight",
          slug: "logitech-g-pro-x-superlight",
          sku: "MOUSE-LOGI-SUPERLIGHT",
          price: 2490000,
          originalPrice: 2790000,
          stockQuantity: 18,
          category: catId["chuot"],
          thumbnail: SEED_IMAGES.mouse,
          status: "ACTIVE",
        },
        specs: [
          { specKey: "Kết nối", specValue: "Wireless" },
          { specKey: "Trọng lượng", specValue: "~63g" },
          { specKey: "Cảm biến", specValue: "HERO" },
        ],
      },
      {
        // Mouse 2
        product: {
          name: "Chuột gaming wired 8000 DPI",
          slug: "chuot-gaming-wired-8000-dpi",
          sku: "MOUSE-WIRED-8000DPI",
          price: 390000,
          originalPrice: 490000,
          stockQuantity: 50,
          category: catId["chuot"],
          thumbnail: SEED_IMAGES.mouse,
          status: "ACTIVE",
        },
        specs: [
          { specKey: "Kết nối", specValue: "USB" },
          { specKey: "DPI", specValue: "8000" },
          { specKey: "LED", specValue: "RGB" },
        ],
      },
      {
        // Mousepad
        product: {
          name: "Lót chuột size XL (800x300)",
          slug: "lot-chuot-size-xl-800x300",
          sku: "PAD-XL-800-300",
          price: 199000,
          originalPrice: 249000,
          stockQuantity: 70,
          category: catId["lot-chuot"],
          thumbnail: SEED_IMAGES.mouse,
          status: "ACTIVE",
        },
        specs: [
          { specKey: "Kích thước", specValue: "800x300mm" },
          { specKey: "Bề mặt", specValue: "Speed/Control" },
          { specKey: "Đế", specValue: "Chống trượt" },
        ],
      },
      {
        // 8. Headset
        product: {
          name: "ASUS TUF H1 Gen II USB Hatsune Miku Edition",
          slug: "asus-tuf-h1-gen-ii-usb-hatsune-miku",
          sku: "HS-ASUS-TUFH1G2-MIKU",
          price: 1890000,
          originalPrice: 2090000,
          stockQuantity: 10,
          category: catId["tai-nghe"],
          thumbnail: SEED_IMAGES.headset,
          status: "ACTIVE",
        },
        specs: [
          { specKey: "Kết nối", specValue: "USB" },
          { specKey: "Micro", specValue: "Có" },
          { specKey: "Surround", specValue: "Virtual 7.1" },
        ],
      },
      {
        // Headset 2
        product: {
          name: "Tai nghe gaming 3.5mm kèm mic",
          slug: "tai-nghe-gaming-3-5mm-kem-mic",
          sku: "HS-35MM-MIC",
          price: 490000,
          originalPrice: 590000,
          stockQuantity: 28,
          category: catId["tai-nghe"],
          thumbnail: SEED_IMAGES.headset,
          status: "ACTIVE",
        },
        specs: [
          { specKey: "Kết nối", specValue: "3.5mm" },
          { specKey: "Micro", specValue: "Có" },
          { specKey: "Đèn", specValue: "Không" },
        ],
      },
      {
        // 9. Gaming chair (black)
        product: {
          name: "Ghế gaming AndaSeat Novis Black (PVC)",
          slug: "ghe-gaming-andaseat-novis-black-pvc",
          sku: "CHAIR-ANDA-NOVIS-BLK",
          price: 5490000,
          originalPrice: 5990000,
          stockQuantity: 6,
          category: catId["ghe-gaming"],
          thumbnail: SEED_IMAGES.chairBlack,
          status: "ACTIVE",
        },
        specs: [
          { specKey: "Chất liệu", specValue: "PVC" },
          { specKey: "Ngả lưng", specValue: "Có" },
          { specKey: "Tay vịn", specValue: "Điều chỉnh" },
        ],
      },
      {
        // 10. Gaming chair (grey)
        product: {
          name: "Ghế gaming AndaSeat Novis Grey (Fabric)",
          slug: "ghe-gaming-andaseat-novis-grey-fabric",
          sku: "CHAIR-ANDA-NOVIS-GRY",
          price: 5890000,
          originalPrice: 6390000,
          stockQuantity: 4,
          category: catId["ghe-gaming"],
          thumbnail: SEED_IMAGES.chairGrey,
          status: "ACTIVE",
        },
        specs: [
          { specKey: "Chất liệu", specValue: "Vải" },
          { specKey: "Ngả lưng", specValue: "Có" },
          { specKey: "Tải trọng", specValue: "~120kg" },
        ],
      },
      {
        // 11. SSD
        product: {
          name: "SSD NVMe 1TB PCIe 4.0",
          slug: "ssd-nvme-1tb-pcie-4-0",
          sku: "SSD-NVME-1TB-GEN4",
          price: 1690000,
          originalPrice: 1990000,
          stockQuantity: 35,
          category: catId["ssd"],
          thumbnail: SEED_IMAGES.keyboard,
          status: "ACTIVE",
        },
        specs: [
          { specKey: "Dung lượng", specValue: "1TB" },
          { specKey: "Chuẩn", specValue: "M.2 NVMe" },
          { specKey: "PCIe", specValue: "Gen 4.0" },
        ],
      },
      {
        // SSD 2
        product: {
          name: "SSD NVMe 500GB PCIe 3.0",
          slug: "ssd-nvme-500gb-pcie-3-0",
          sku: "SSD-NVME-500G-GEN3",
          price: 790000,
          originalPrice: 950000,
          stockQuantity: 32,
          category: catId["ssd"],
          thumbnail: SEED_IMAGES.keyboard,
          status: "ACTIVE",
        },
        specs: [
          { specKey: "Dung lượng", specValue: "500GB" },
          { specKey: "Chuẩn", specValue: "M.2 NVMe" },
          { specKey: "PCIe", specValue: "Gen 3.0" },
        ],
      },
      {
        // HDD
        product: {
          name: "HDD 1TB 7200RPM",
          slug: "hdd-1tb-7200rpm",
          sku: "HDD-1TB-7200",
          price: 990000,
          originalPrice: 1150000,
          stockQuantity: 13,
          category: catId["hdd"],
          thumbnail: SEED_IMAGES.keyboard,
          status: "ACTIVE",
        },
        specs: [
          { specKey: "Dung lượng", specValue: "1TB" },
          { specKey: "Tốc độ", specValue: "7200RPM" },
          { specKey: "Chuẩn", specValue: "SATA 3" },
        ],
      },
      {
        // 12. Case
        product: {
          name: "Case Mid Tower Tempered Glass",
          slug: "case-mid-tower-tempered-glass",
          sku: "CASE-MID-TG",
          price: 1290000,
          originalPrice: 1490000,
          stockQuantity: 14,
          category: catId["case"],
          thumbnail: SEED_IMAGES.keyboard,
          status: "ACTIVE",
        },
        specs: [
          { specKey: "Kích thước", specValue: "Mid Tower" },
          { specKey: "Kính", specValue: "Tempered Glass" },
          { specKey: "Hỗ trợ main", specValue: "ATX / mATX" },
        ],
      },
      {
        // Case 2
        product: {
          name: "Case mATX Airflow",
          slug: "case-matx-airflow",
          sku: "CASE-MATX-AIR",
          price: 990000,
          originalPrice: 1190000,
          stockQuantity: 17,
          category: catId["case"],
          thumbnail: SEED_IMAGES.keyboard,
          status: "ACTIVE",
        },
        specs: [
          { specKey: "Kích thước", specValue: "mATX" },
          { specKey: "Airflow", specValue: "Mesh front" },
          { specKey: "Fan", specValue: "Hỗ trợ 6 fan" },
        ],
      },
      {
        // Cooler
        product: {
          name: "Tản nhiệt khí 120mm Tower",
          slug: "tan-nhiet-khi-120mm-tower",
          sku: "COOL-AIR-120-TOWER",
          price: 490000,
          originalPrice: 590000,
          stockQuantity: 21,
          category: catId["tan-nhiet"],
          thumbnail: SEED_IMAGES.cpu,
          status: "ACTIVE",
        },
        specs: [
          { specKey: "Loại", specValue: "Air cooler" },
          { specKey: "Fan", specValue: "120mm" },
          { specKey: "Socket", specValue: "Intel/AMD" },
        ],
      },
      {
        // Case fan pack
        product: {
          name: "Bộ 3 quạt case 120mm ARGB",
          slug: "bo-3-quat-case-120mm-argb",
          sku: "FAN-3PACK-120-ARGB",
          price: 390000,
          originalPrice: 490000,
          stockQuantity: 26,
          category: catId["quat-case"],
          thumbnail: SEED_IMAGES.keyboard,
          status: "ACTIVE",
        },
        specs: [
          { specKey: "Kích thước", specValue: "120mm" },
          { specKey: "LED", specValue: "ARGB" },
          { specKey: "Số lượng", specValue: "3" },
        ],
      },
      {
        // 13. Monitor
        product: {
          name: "Màn hình 24 inch 165Hz IPS",
          slug: "man-hinh-24-inch-165hz-ips",
          sku: "MON-24-165-IPS",
          price: 3290000,
          originalPrice: 3690000,
          stockQuantity: 9,
          category: catId["man-hinh"],
          thumbnail: SEED_IMAGES.keyboard,
          status: "ACTIVE",
        },
        specs: [
          { specKey: "Kích thước", specValue: "24 inch" },
          { specKey: "Tần số quét", specValue: "165Hz" },
          { specKey: "Tấm nền", specValue: "IPS" },
        ],
      },
      {
        // Monitor 2
        product: {
          name: "Màn hình 27 inch 2K 165Hz IPS",
          slug: "man-hinh-27-inch-2k-165hz-ips",
          sku: "MON-27-2K-165-IPS",
          price: 6290000,
          originalPrice: 6990000,
          stockQuantity: 5,
          category: catId["man-hinh"],
          thumbnail: SEED_IMAGES.keyboard,
          status: "ACTIVE",
        },
        specs: [
          { specKey: "Kích thước", specValue: "27 inch" },
          { specKey: "Độ phân giải", specValue: "2560x1440" },
          { specKey: "Tần số quét", specValue: "165Hz" },
        ],
      },
      {
        // Monitor 3 (out of stock)
        product: {
          name: "Màn hình 24 inch 75Hz",
          slug: "man-hinh-24-inch-75hz",
          sku: "MON-24-75",
          price: 2190000,
          originalPrice: 2490000,
          stockQuantity: 0,
          category: catId["man-hinh"],
          thumbnail: SEED_IMAGES.keyboard,
          status: "ACTIVE",
        },
        specs: [
          { specKey: "Kích thước", specValue: "24 inch" },
          { specKey: "Tần số quét", specValue: "75Hz" },
          { specKey: "Tấm nền", specValue: "IPS" },
        ],
      },
    ];

    for (const item of productsData) {
      const newProduct = await Product.create(item.product);

      const specsWithId = item.specs.map((spec) => ({
        ...spec,
        product: newProduct._id,
      }));

      await ProductSpec.insertMany(specsWithId);
      console.log(
        `+ Đã tạo: ${item.product.name} kèm ${item.specs.length} thông số.`,
      );
    }

    console.log("🎉 KHỞI TẠO DỮ LIỆU THÀNH CÔNG!");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Lỗi:", error);
    try {
      await mongoose.disconnect();
    } catch (_) {
      // ignore
    }
    process.exit(1);
  }
};

seedData();
