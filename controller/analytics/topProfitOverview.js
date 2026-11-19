const checkoutModel = require("../../model/checkout/checkoutModel");
const dressModel = require("../../model/dress/dress");
const authModel = require("../../model/authentication/authentication");
const profitGenerate = async (req, res) => {
  try {
    const orders = await checkoutModel
      .find({ orderStatus: "Delivered" })
      .lean();

    if (!orders.length) {
      return res.status(200).json({
        success: true,
        message: "No delivered orders found",
        data: {
          topSellingProduct: null,
          leastSellingProduct: null,
          mostSellingCategory: null,
          leastSellingCategory: null,
          mostPurchasingAgeGroup: null,
          leastPurchasingAgeGroup: null,
          highestRevenueAgeGroup: null,
          lowestRevenueAgeGroup: null,
        },
      });
    }

    const productIds = [
      ...new Set(
        orders
          .map((order) => order.product?.productId?.toString())
          .filter(Boolean),
      ),
    ];

    const userIds = [
      ...new Set(orders.map((order) => order.user?.toString()).filter(Boolean)),
    ];

    const products = await dressModel
      .find({
        _id: { $in: productIds },
      })
      .select("category");

    const users = await authModel
      .find({
        _id: { $in: userIds },
      })
      .select("Age FullName Email");

    const productsMap = new Map(
      products.map((product) => [product._id.toString(), product]),
    );

    const usersMap = new Map(users.map((user) => [user._id.toString(), user]));

    const productAnalysis = {};
    const categoryAnalysis = {};
    const ageAnalysis = {};

    orders.forEach((order) => {
      const product = order.product;
      if (!product) return;

      const productId = product.productId?.toString();

      const quantity = Number(product.quantity) || 0;

      const price = Number(product.finalPrice ?? product.price) || 0;

      const revenue = price * quantity;

      const productDetails = productsMap.get(productId);

      const productName = product.name || "Unknown Product";

      const category = productDetails?.category || "Uncategorized";

      if (productId) {
        if (!productAnalysis[productId]) {
          productAnalysis[productId] = {
            productId,
            productName,
            quantitySold: 0,
            revenue: 0,
          };
        }

        productAnalysis[productId].quantitySold += quantity;
        productAnalysis[productId].revenue += revenue;
      }
      if (!categoryAnalysis[category]) {
        categoryAnalysis[category] = {
          category,
          quantitySold: 0,
          revenue: 0,
        };
      }

      categoryAnalysis[category].quantitySold += quantity;

      categoryAnalysis[category].revenue += revenue;

      const customer = usersMap.get(order.user?.toString());
      if (!customer || customer.Age == null) return;
      const age = Number(customer.Age);

      if (!Number.isFinite(age) || age < 0) return;

      let ageGroup;
      if (age < 18) {
        ageGroup = "Under 18";
      } else if (age <= 25) {
        ageGroup = "18-25";
      } else if (age <= 35) {
        ageGroup = "26-35";
      } else if (age <= 45) {
        ageGroup = "36-45";
      } else if (age <= 60) {
        ageGroup = "46-60";
      } else {
        ageGroup = "60+";
      }

      if (!ageAnalysis[ageGroup]) {
        ageAnalysis[ageGroup] = {
          ageGroup,
          totalOrders: 0,
          quantitySold: 0,
          revenue: 0,
          customers: new Set(),
        };
      }
      ageAnalysis[ageGroup].totalOrders += 1;

      ageAnalysis[ageGroup].quantitySold += quantity;

      ageAnalysis[ageGroup].revenue += revenue;

      ageAnalysis[ageGroup].customers.add(order.user.toString());
    });

    const allProducts = Object.values(productAnalysis);

    const allCategories = Object.values(categoryAnalysis);

    const allAgeGroups = Object.values(ageAnalysis).map((item) => ({
      ageGroup: item.ageGroup,
      totalOrders: item.totalOrders,
      quantitySold: item.quantitySold,
      revenue: Number(item.revenue.toFixed(2)),
      totalCustomers: item.customers.size,
    }));

    const sortedProducts = [...allProducts].sort(
      (a, b) => b.quantitySold - a.quantitySold,
    );

    const sortedCategories = [...allCategories].sort(
      (a, b) => b.quantitySold - a.quantitySold,
    );

    const sortedAgeByCustomers = [...allAgeGroups].sort(
      (a, b) => b.totalCustomers - a.totalCustomers,
    );

    const sortedAgeByRevenue = [...allAgeGroups].sort(
      (a, b) => b.revenue - a.revenue,
    );

    const profitgenerateByAnalysis = {
      topSellingProduct: sortedProducts[0] || null,

      leastSellingProduct: sortedProducts[sortedProducts.length - 1] || null,

      mostSellingCategory: sortedCategories[0] || null,

      leastSellingCategory:
        sortedCategories[sortedCategories.length - 1] || null,

      mostPurchasingAgeGroup: sortedAgeByCustomers[0] || null,

      leastPurchasingAgeGroup:
        sortedAgeByCustomers[sortedAgeByCustomers.length - 1] || null,

      highestRevenueAgeGroup: sortedAgeByRevenue[0] || null,

      lowestRevenueAgeGroup:
        sortedAgeByRevenue[sortedAgeByRevenue.length - 1] || null,
    };

    return res.status(200).json({
      success: true,
      message: "Profit analysis generated successfully",
      data: profitgenerateByAnalysis,
    });
  } catch (error) {
    console.error("Profit Generate Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate business analytics",
      error: error.message,
    });
  }
};

module.exports = { profitGenerate };
