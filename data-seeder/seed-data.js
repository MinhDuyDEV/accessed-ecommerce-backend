// seed-data.js
const axios = require('axios');

// Cấu hình
// Nếu API server của bạn có tiền tố '/api', hãy đảm bảo URL không bao gồm '/api' ở đây
// vì nó sẽ được thêm vào trong hàm callApi
const API_URL = 'http://localhost:8000';
const ADMIN_USER = {
  username: 'admin',
  email: 'admin@example.com',
  password: 'Admin@123',
  fullName: 'Admin User',
};

// Đọc dữ liệu mẫu
const categories = require('./data/categories.json');
const brands = require('./data/brands.json');
const productAttributes = require('./data/product-attributes.json');
const products = require('./data/products.json');

// Biến lưu trữ token và ID
let accessToken = '';
let refreshToken = '';
let tokenExpiration = 0; // Thời điểm hết hạn của token (timestamp)
let categoryIds = {};
let brandIds = {};
let attributeIds = {};
let attributeValueIds = {};

// Hàm trợ giúp để gọi API
async function callApi(method, endpoint, data = null, auth = false) {
  try {
    // Kiểm tra xem token có hết hạn không và refresh nếu cần
    if (auth && tokenExpiration > 0 && Date.now() > tokenExpiration) {
      console.log('Access token đã hết hạn, đang làm mới token...');
      await refreshAccessToken();
    }

    const headers = {
      'Content-Type': 'application/json',
    };
    if (auth) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    // Thêm tiền tố '/api' vào endpoint
    const apiEndpoint = `api/${endpoint}`;

    const config = {
      method,
      url: `${API_URL}/${apiEndpoint}`,
      headers,
      data,
    };

    console.log(`Calling ${config.url}...`);
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`Error calling ${endpoint}:`);
    if (error.response) {
      // Lỗi từ server (status code không phải 2xx)
      console.error(`Status: ${error.response.status}`);
      console.error('Response data:', error.response.data);

      // Nếu lỗi 401 Unauthorized và đang sử dụng auth, thử refresh token
      if (error.response.status === 401 && auth && refreshToken) {
        console.log('Nhận được lỗi 401, đang thử làm mới token...');
        await refreshAccessToken();

        // Thử lại request với token mới
        console.log('Thử lại request với token mới...');
        return callApi(method, endpoint, data, auth);
      }
    } else if (error.request) {
      // Không nhận được phản hồi từ server
      console.error('No response received:', error.request);
    } else {
      // Lỗi khi thiết lập request
      console.error('Error message:', error.message);
    }
    throw error;
  }
}

// Hàm làm mới access token
async function refreshAccessToken() {
  try {
    console.log('Đang làm mới access token...');
    const response = await axios({
      method: 'post',
      url: `${API_URL}/api/auth/refresh-token`,
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        refreshToken,
      },
    });

    console.log('Làm mới token thành công!');
    accessToken = response.data.accessToken;
    refreshToken = response.data.refreshToken;

    // Cập nhật thời gian hết hạn
    if (response.data.expiresIn) {
      tokenExpiration = Date.now() + response.data.expiresIn * 1000;
      console.log(`Token mới sẽ hết hạn sau ${response.data.expiresIn} giây`);
    } else {
      // Mặc định 15 phút
      tokenExpiration = Date.now() + 15 * 60 * 1000;
    }

    return true;
  } catch (error) {
    console.error('Không thể làm mới token:', error.message);
    console.log('Đang thử đăng nhập lại...');
    await registerAndLogin();
    return false;
  }
}

// 1. Đăng ký và đăng nhập
async function registerAndLogin() {
  try {
    // Kiểm tra xem người dùng đã tồn tại chưa
    try {
      console.log('Đang thử đăng nhập...');
      console.log('Thông tin đăng nhập:', {
        email: ADMIN_USER.email,
        password: '******',
      });

      const loginResponse = await callApi('post', 'auth/login', {
        email: ADMIN_USER.email,
        password: ADMIN_USER.password,
      });

      console.log('Đăng nhập thành công!');
      console.log('Token info:', {
        accessToken: loginResponse.accessToken
          ? `${loginResponse.accessToken.substring(0, 15)}...`
          : 'undefined',
        tokenType: typeof loginResponse.accessToken,
        expiresIn: loginResponse.expiresIn,
      });

      accessToken = loginResponse.accessToken;
      refreshToken = loginResponse.refreshToken;

      // Lưu thời gian hết hạn
      if (loginResponse.expiresIn) {
        tokenExpiration = Date.now() + loginResponse.expiresIn * 1000;
        console.log(`Token sẽ hết hạn sau ${loginResponse.expiresIn} giây`);
      } else {
        // Mặc định 15 phút
        tokenExpiration = Date.now() + 15 * 60 * 1000;
      }

      // Kiểm tra token
      if (!accessToken) {
        throw new Error('Access token không được trả về từ API đăng nhập');
      }
    } catch (loginError) {
      // Nếu đăng nhập thất bại, thử đăng ký
      console.log('Đăng nhập thất bại, đang thử đăng ký...');
      console.log('Thông tin đăng ký:', {
        username: ADMIN_USER.username,
        email: ADMIN_USER.email,
        password: '******',
        fullName: ADMIN_USER.fullName,
      });

      const registerResponse = await callApi(
        'post',
        'auth/register',
        ADMIN_USER,
      );

      console.log('Đăng ký thành công!');
      console.log('Token info:', {
        accessToken: registerResponse.accessToken
          ? `${registerResponse.accessToken.substring(0, 15)}...`
          : 'undefined',
        tokenType: typeof registerResponse.accessToken,
        expiresIn: registerResponse.expiresIn,
      });

      accessToken = registerResponse.accessToken;
      refreshToken = registerResponse.refreshToken;

      // Lưu thời gian hết hạn
      if (registerResponse.expiresIn) {
        tokenExpiration = Date.now() + registerResponse.expiresIn * 1000;
        console.log(`Token sẽ hết hạn sau ${registerResponse.expiresIn} giây`);
      } else {
        // Mặc định 15 phút
        tokenExpiration = Date.now() + 15 * 60 * 1000;
      }

      // Kiểm tra token
      if (!accessToken) {
        throw new Error('Access token không được trả về từ API đăng ký');
      }
    }

    // Kiểm tra token cuối cùng
    console.log('Final token check:', Boolean(accessToken), typeof accessToken);
  } catch (error) {
    console.error('Không thể đăng ký hoặc đăng nhập:', error);
    process.exit(1);
  }
}

// 2. Tạo danh mục
async function createCategories() {
  console.log('Đang tạo danh mục...');

  // Tạo danh mục cha trước
  const rootCategories = categories.filter((cat) => !cat.parentName);
  const rootCategoryPromises = rootCategories.map(async (category) => {
    try {
      const response = await callApi('post', 'categories', category, true);
      categoryIds[category.name] = response.id;
      console.log(`Đã tạo danh mục: ${category.name}`);
      return { success: true, name: category.name };
    } catch (error) {
      console.error(`Lỗi khi tạo danh mục ${category.name}:`, error);
      return { success: false, name: category.name };
    }
  });

  // Đợi tất cả danh mục cha được tạo
  await Promise.all(rootCategoryPromises);

  // Sau đó tạo danh mục con
  const childCategories = categories.filter((cat) => cat.parentName);
  const childCategoryPromises = childCategories.map(async (category) => {
    try {
      // Thay thế tên danh mục cha bằng ID thực
      const parentName = category.parentName;
      const parentId = categoryIds[parentName];

      if (!parentId) {
        console.error(`Không tìm thấy ID cho danh mục cha: ${parentName}`);
        return { success: false, name: category.name };
      }

      const categoryData = { ...category, parentId };
      delete categoryData.parentName;

      const response = await callApi('post', 'categories', categoryData, true);
      categoryIds[category.name] = response.id;
      console.log(`Đã tạo danh mục con: ${category.name}`);
      return { success: true, name: category.name };
    } catch (error) {
      console.error(`Lỗi khi tạo danh mục con ${category.name}:`, error);
      return { success: false, name: category.name };
    }
  });

  // Đợi tất cả danh mục con được tạo
  await Promise.all(childCategoryPromises);
}

// 3. Tạo thương hiệu
async function createBrands() {
  console.log('Đang tạo thương hiệu...');

  const brandPromises = brands.map(async (brand) => {
    try {
      const response = await callApi('post', 'brands', brand, true);
      brandIds[brand.name] = response.id;
      console.log(`Đã tạo thương hiệu: ${brand.name}`);
      return { success: true, name: brand.name };
    } catch (error) {
      console.error(`Lỗi khi tạo thương hiệu ${brand.name}:`, error);
      return { success: false, name: brand.name };
    }
  });

  // Đợi tất cả thương hiệu được tạo
  await Promise.all(brandPromises);
}

// 4. Tạo thuộc tính sản phẩm
async function createProductAttributes() {
  console.log('Đang tạo thuộc tính sản phẩm...');

  const attributePromises = productAttributes.map(async (attribute) => {
    try {
      // Tạo thuộc tính
      const attrData = {
        name: attribute.name,
        description: attribute.description,
        isActive: true,
      };

      const response = await callApi(
        'post',
        'product-attributes',
        attrData,
        true,
      );
      attributeIds[attribute.name] = response.id;
      console.log(`Đã tạo thuộc tính: ${attribute.name}`);

      // Tạo giá trị thuộc tính
      const valuePromises = attribute.values.map(async (value) => {
        try {
          const valueResponse = await callApi(
            'post',
            `product-attributes/${response.id}/values`,
            {
              value: value.value,
              description: value.description,
              colorCode: value.colorCode,
            },
            true,
          );

          // Lưu ID của giá trị thuộc tính
          const key = `${attribute.name}:${value.value}`;
          attributeValueIds[key] = valueResponse.id;
          console.log(`  Đã tạo giá trị: ${value.value}`);
          return { success: true, value: value.value };
        } catch (valueError) {
          console.error(`  Lỗi khi tạo giá trị ${value.value}:`, valueError);
          return { success: false, value: value.value };
        }
      });

      // Đợi tất cả giá trị thuộc tính được tạo
      await Promise.all(valuePromises);
      return { success: true, name: attribute.name };
    } catch (error) {
      console.error(`Lỗi khi tạo thuộc tính ${attribute.name}:`, error);
      return { success: false, name: attribute.name };
    }
  });

  // Đợi tất cả thuộc tính được tạo
  await Promise.all(attributePromises);
}

// Hàm tạo thêm sản phẩm cho mỗi danh mục
function generateMoreProducts() {
  console.log('Đang tạo thêm sản phẩm...');

  // Danh sách các tính từ mô tả
  const adjectives = [
    'Premium',
    'Luxury',
    'Professional',
    'Classic',
    'Modern',
    'Elegant',
    'Stylish',
    'Compact',
    'Portable',
    'Durable',
    'Advanced',
    'Smart',
    'Innovative',
    'Ergonomic',
    'Lightweight',
    'High-End',
    'Budget',
    'Exclusive',
    'Limited Edition',
    'Bestselling',
  ];

  // Danh sách các màu sắc
  const colors = [
    'Black',
    'White',
    'Silver',
    'Gold',
    'Blue',
    'Red',
    'Green',
    'Purple',
    'Pink',
    'Orange',
    'Gray',
    'Brown',
    'Yellow',
    'Teal',
    'Navy',
  ];

  // Danh sách các kích thước
  const sizes = [
    'Small',
    'Medium',
    'Large',
    'X-Large',
    'XX-Large',
    'Mini',
    'Compact',
    'Standard',
    'Oversized',
    'Tiny',
  ];

  // Tạo danh sách danh mục và số lượng sản phẩm cần tạo thêm
  const categoryProducts = {};

  // Đếm số lượng sản phẩm hiện có trong mỗi danh mục
  for (const product of products) {
    for (const category of product.categories) {
      if (!categoryProducts[category]) {
        categoryProducts[category] = 0;
      }
      categoryProducts[category]++;
    }
  }

  // Tạo thêm sản phẩm cho mỗi danh mục để đạt tối thiểu 20 sản phẩm
  const additionalProducts = [];

  for (const [category, count] of Object.entries(categoryProducts)) {
    const productsToAdd = Math.max(0, 20 - count);
    console.log(
      `Danh mục ${category}: Hiện có ${count} sản phẩm, cần tạo thêm ${productsToAdd} sản phẩm`,
    );

    // Lấy một sản phẩm mẫu từ danh mục này (nếu có)
    const sampleProduct = products.find((p) => p.categories.includes(category));

    // Nếu không có sản phẩm mẫu, sử dụng sản phẩm đầu tiên
    const template = sampleProduct || products[0];

    // Tạo thêm sản phẩm
    for (let i = 0; i < productsToAdd; i++) {
      const adjective =
        adjectives[Math.floor(Math.random() * adjectives.length)];

      // Tạo tên sản phẩm
      const productName = `${adjective} ${category} ${i + 1}`;

      // Tạo giá sản phẩm (giá gốc từ 50 đến 1000)
      const basePrice = Math.floor(Math.random() * 950) + 50;
      const discountPrice = Math.floor(basePrice * 0.9); // Giảm giá 10%

      // Tạo SKU
      const sku = `${category.substring(0, 3).toUpperCase()}${i + 1000}`;

      // Tạo sản phẩm mới - luôn là variable type
      const newProduct = {
        name: productName,
        description: `${adjective} ${category} with premium features and modern design.`,
        type: 'variable', // Luôn là variable để có biến thể
        price: basePrice,
        discountPrice: discountPrice,
        sku: sku,
        quantity: Math.floor(Math.random() * 100) + 10, // 10-110 sản phẩm
        status: 'published',
        weight: Math.floor(Math.random() * 5) + 0.1, // 0.1-5.1 kg
        dimensions: `${Math.floor(Math.random() * 50) + 10} x ${Math.floor(Math.random() * 30) + 10} x ${Math.floor(Math.random() * 20) + 5} cm`,
        brand: template.brand,
        categories: [category],
        images: [
          {
            url: `https://example.com/images/products/${category.toLowerCase()}-${i + 1}.jpg`,
            alt: productName,
            isDefault: true,
          },
        ],
        variants: [],
      };

      // Tạo 2-4 biến thể
      const variantCount = Math.floor(Math.random() * 3) + 2;

      for (let j = 0; j < variantCount; j++) {
        const variantColor = colors[Math.floor(Math.random() * colors.length)];
        const variantSize = sizes[Math.floor(Math.random() * sizes.length)];

        const variant = {
          sku: `${sku}-${j + 1}`,
          name: `${productName} - ${variantColor} - ${variantSize}`,
          price: basePrice + j * 10, // Tăng giá theo biến thể
          discountPrice: discountPrice + j * 8,
          quantity: Math.floor(Math.random() * 30) + 5, // 5-35 sản phẩm
          attributes: {
            Color: variantColor,
            Size: variantSize,
          },
          images: [
            {
              url: `https://example.com/images/products/${category.toLowerCase()}-${i + 1}-${j + 1}.jpg`,
              alt: `${productName} - ${variantColor} - ${variantSize}`,
              isDefault: true,
            },
          ],
        };

        newProduct.variants.push(variant);
      }

      additionalProducts.push(newProduct);
    }
  }

  return additionalProducts;
}

// 5. Tạo sản phẩm và biến thể
async function createProducts() {
  console.log('Đang tạo sản phẩm...');

  // Thêm biến thể cho sản phẩm không có biến thể
  const productsWithVariants = products.map((product) => {
    // Nếu sản phẩm đã có biến thể, giữ nguyên
    if (product.variants && product.variants.length > 0) {
      return product;
    }

    // Nếu không có biến thể, tạo biến thể mặc định
    const colors = ['Black', 'White', 'Silver', 'Gold', 'Blue'];
    const sizes = ['Small', 'Medium', 'Large', 'X-Large', 'Standard'];

    // Tạo bản sao của sản phẩm
    const productCopy = { ...product };

    // Đặt loại sản phẩm là variable
    productCopy.type = 'variable';

    // Tạo 2 biến thể mặc định
    productCopy.variants = [];

    for (let i = 0; i < 2; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = sizes[Math.floor(Math.random() * sizes.length)];

      const variant = {
        sku: `${product.sku || 'SKU'}-${i + 1}`,
        name: `${product.name} - ${color} - ${size}`,
        price: product.price,
        discountPrice: product.discountPrice,
        quantity: Math.floor(product.quantity / 2) || 10,
        attributes: {
          Color: color,
          Size: size,
        },
        images: product.images
          ? [product.images[0]]
          : [
              {
                url: `https://example.com/images/products/default-${i + 1}.jpg`,
                alt: `${product.name} - ${color} - ${size}`,
                isDefault: true,
              },
            ],
      };

      productCopy.variants.push(variant);
    }

    return productCopy;
  });

  // Kết hợp sản phẩm có sẵn và sản phẩm được tạo thêm
  const allProducts = [...productsWithVariants, ...generateMoreProducts()];

  // Chia sản phẩm thành các nhóm nhỏ để tránh quá tải server
  const BATCH_SIZE = 5; // Số sản phẩm xử lý đồng thời
  const batches = [];

  for (let i = 0; i < allProducts.length; i += BATCH_SIZE) {
    batches.push(allProducts.slice(i, i + BATCH_SIZE));
  }

  // Xử lý từng nhóm sản phẩm
  for (const batch of batches) {
    const productPromises = batch.map(async (product) => {
      try {
        // Chuyển đổi tên danh mục và thương hiệu thành ID
        const categoryIdsArray = product.categories
          .map((catName) => categoryIds[catName])
          .filter((id) => id);
        const brandId = brandIds[product.brand];

        if (!brandId) {
          console.error(`Không tìm thấy ID cho thương hiệu: ${product.brand}`);
          return { success: false, name: product.name };
        }

        // Chuẩn bị dữ liệu sản phẩm
        const productData = {
          name: product.name,
          description: product.description,
          type: product.type || 'variable', // Đảm bảo tất cả sản phẩm đều là variable
          price: product.price,
          discountPrice: product.discountPrice,
          sku: product.sku,
          quantity: product.quantity || 0,
          status: product.status || 'published',
          // Chuyển đổi weight thành số nguyên nếu có
          weight: product.weight ? Math.round(product.weight * 1000) : null, // Chuyển kg thành gram
          dimensions: product.dimensions,
          brandId,
          categoryIds: categoryIdsArray,
          images: product.images,
          variants: [],
        };

        // Chuẩn bị biến thể nếu có
        if (product.variants && product.variants.length > 0) {
          for (const variant of product.variants) {
            const variantData = {
              sku: variant.sku,
              name: variant.name,
              price: variant.price,
              discountPrice: variant.discountPrice,
              quantity: variant.quantity || 0,
              isActive: true,
              // Chuyển đổi weight thành số nguyên nếu có
              weight: variant.weight ? Math.round(variant.weight * 1000) : null, // Chuyển kg thành gram
              dimensions: variant.dimensions,
              attributeValues: [], // Mảng các đối tượng CreateProductAttributeValueDto
            };

            // Thêm giá trị thuộc tính cho biến thể
            if (variant.attributes) {
              // Chuyển đổi từ đối tượng attributes sang mảng đối tượng CreateProductAttributeValueDto
              for (const [attrName, value] of Object.entries(
                variant.attributes,
              )) {
                // Tìm ID của thuộc tính
                const attributeId = attributeIds[attrName];

                if (!attributeId) {
                  console.error(
                    `Không tìm thấy ID cho thuộc tính: ${attrName}`,
                  );
                  continue;
                }

                // Thêm đối tượng CreateProductAttributeValueDto vào mảng
                variantData.attributeValues.push({
                  attributeId: attributeId,
                  value: String(value), // Đảm bảo value là chuỗi
                });
              }
            }

            // Thêm hình ảnh cho biến thể nếu có
            if (variant.images) {
              variantData.images = variant.images;
            }

            productData.variants.push(variantData);
          }
        }

        // In ra dữ liệu sản phẩm để kiểm tra
        console.log(`Đang tạo sản phẩm: ${product.name}`);

        // Gọi API tạo sản phẩm
        await callApi('post', 'products', productData, true);
        console.log(`Đã tạo sản phẩm: ${product.name}`);
        return { success: true, name: product.name };
      } catch (error) {
        console.error(`Lỗi khi tạo sản phẩm ${product.name}:`, error);

        // Hiển thị thông tin lỗi chi tiết hơn
        if (error.response) {
          console.error('Chi tiết lỗi:', {
            status: error.response.status,
            data: error.response.data,
            headers: error.response.headers,
          });
        }
        return { success: false, name: product.name };
      }
    });

    // Đợi tất cả sản phẩm trong nhóm được tạo
    await Promise.all(productPromises);

    // Tạm dừng giữa các nhóm để tránh quá tải server
    if (batches.length > 1) {
      console.log('Tạm dừng 2 giây giữa các nhóm sản phẩm...');
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
}

// Hàm chính để chạy tất cả các bước
async function seedData() {
  try {
    console.log('Bắt đầu tạo dữ liệu mẫu...');

    // Bước 1: Đăng ký/Đăng nhập
    await registerAndLogin();

    // Bước 2: Tạo danh mục
    await createCategories();

    // Bước 3: Tạo thương hiệu
    await createBrands();

    // Bước 4: Tạo thuộc tính sản phẩm
    await createProductAttributes();

    // Bước 5: Tạo sản phẩm và biến thể
    await createProducts();

    console.log('Hoàn thành tạo dữ liệu mẫu!');
  } catch (error) {
    console.error('Lỗi khi tạo dữ liệu mẫu:', error);
  }
}

// Chạy script
seedData();
