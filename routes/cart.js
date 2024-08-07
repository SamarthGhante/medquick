const Cart = require("../models/Cart");
const {
    verifyToken,
    verifyTokenAndAuthorization,
    verifyTokenAndAdmin,
} = require("./verifyToken");

const router = require("express").Router();

router.get("/", async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: currentUser_Id }).populate('products.productId');
        res.render("Cart", { cart });
    } catch (err) {
        console.error("Error fetching cart:", err);
        res.status(500).send("Internal Server Error");
    }
});
// CREATE
router.post("/", async (req, res) => {
    if (SignedIn) {
        const { userId, productId, quantity } = req.body;
        console.log("Received request with:", req.body);

        try {
            let cart = await Cart.findOne({ userId });
            if (cart) {
                // If cart exists, update the quantity of the product if it already exists in the cart
                let productIndex = cart.products.findIndex(p => p.productId === productId);
                if (productIndex > -1) {
                    let productItem = cart.products[productIndex];
                    productItem.quantity += parseInt(quantity);
                    cart.products[productIndex] = productItem;
                } else {
                    // If product does not exist in cart, add it
                    cart.products.push({ productId, quantity });
                }
                cart = await cart.save();
                res.redirect("/");
            } else {
                // If no cart exists for the user, create a new one
                const newCart = new Cart({
                    userId,
                    products: [{ productId, quantity }]
                });
                const savedCart = await newCart.save();
                res.redirect("/");
            }
        } catch (err) {
            console.error("Error saving cart:", err); // Log the error for debugging
            res.status(500).json({ message: "Failed to save cart", error: err });
        }
    } else {
        res.send(`
            <script>
                alert("You must be signed in to add items to your cart.");
                window.location.href = "/login"; // Redirect to login page
            </script>
        `);
    }
});

//UPDATE
router.put("/:id", async (req, res) => {
    try {
        const updatedCart = await Cart.findByIdAndUpdate(
            req.params.id,
            {
                $set: req.body,
            },
            { new: true }
        );
        res.status(200).json(updatedCart);
    } catch (err) {
        res.status(500).json(err);
    }
});

//DELETE
router.delete("/:id", verifyTokenAndAuthorization, async (req, res) => {
    try {
        await Cart.findByIdAndDelete(req.params.id);
        res.status(200).json("Cart has been deleted...");
    } catch (err) {
        res.status(500).json(err);
    }
});

//GET USER CART
router.get("/find/:userId", verifyTokenAndAuthorization, async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: req.params.userId });
        res.status(200).json(cart);
    } catch (err) {
        res.status(500).json(err);
    }
});

// //GET ALL

router.get("/", verifyTokenAndAdmin, async (req, res) => {
    try {
        const carts = await Cart.find();
        res.status(200).json(carts);
    } catch (err) {
        res.status(500).json(err);
    }
});

module.exports = router;