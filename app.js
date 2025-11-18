// SECTION 1: VUE 2.7.8 OPTIONS API IMPLEMENTATION
// This file contains the main Vue instance for the shopping cart
// Uses Vue 2 Options API (not Composition API)
// Demonstrates core Vue 2 features: data, computed, methods

new Vue({
    // SECTION 1A: VUE INSTANCE MOUNTING
    // This section handles: Connecting Vue to HTML element
    // el: '#app' tells Vue to mount this instance to the div with id="app"
    // This is how Vue 2 attaches to HTML elements
    el: '#app',
    
    // SECTION 2: VUE 2 REACTIVE DATA
    // This section handles: Application state management
    // data() returns reactive data object
    // All properties in data are reactive - changes trigger UI updates
    // This is the Model in MVC pattern
    data: {
        // SECTION 2A: PRODUCTS DATA ARRAY
        // This section handles: Educational lessons catalog
        // Static array of 10 educational lessons
        // Each product has: id, name, description, price, spaces, quantity, inCart status
        // spaces tracks available spots (0 = out of stock)
        // quantity tracks how many spaces user wants to buy
        // inCart tracks whether item is in shopping cart
        products: [
            {
                id: 1,
                name: 'Mobile App Development',
                Location:'Birmingham',
                price: "£88.99",
                spaces: 10,
                quantity: 1,
                inCart: false
            },
            {
                id: 2,
                name: 'Artificial Intelligence & Machine Learning',
                Location:'West-Ham',
                price: "£149.99",
                spaces: 8,
                quantity: 1,
                inCart: false
            },
            {
                id: 3,
                name: 'Cloud Computing with AWS or Azure Lab Course',
                Location:'Newcastle',
                price: "£99.99",
                spaces: 5,
                quantity: 1,
                inCart: false
            },
            {
                id: 4,
                name: 'Cybersecurity Basics',
                Location:'Bristol',
                price: "£250",
                spaces: 5,
                quantity: 1,
                inCart: false
            },
            {
                id: 5,
                name: 'UI/UX Design Principles',
                Location:'Brentford',
                price: "£220",
                spaces: 5,
                quantity: 1,
                inCart: false
            },
            {
                id: 6,
                name: 'Project Management',
                Location:'Manchester',
                price: "£250",
                spaces: 5,
                quantity: 1,
                inCart: false
            },
            {
                id: 7,
                name: 'Computer Science',
                Location:'Villa-park',
                price: "£200",
                spaces: 10,
                quantity: 1,
                inCart: false
            },
            {
                id: 8,
                name: 'Database Design & SQL',
                Location:'Leicester',
                price: "£199",
                spaces: 7,
                quantity: 1,
                inCart: false
            },
            {
                id: 9,
                name: 'Backend Development with Node.js',
                Location:'Norwich',
                price: "£209",
                spaces: 5,
                quantity: 1,
                inCart: false
            },
            {
                id: 10,
                name: 'Python Programming',
                Location:'Liverpool',
                price: "£150",
                spaces: 12,
                quantity: 1,
                inCart: false
            }
        ],
        
        // SECTION 2B: SHOPPING CART STATE
        // This section handles: Cart items storage
        // cart[] stores items added to shopping cart
        // Initially empty, populated when user adds items
        // This is the main state for cart functionality
        cart: [],
        
        // SECTION 2C: SEARCH AND SORT FUNCTIONALITY
        // This section handles: Search query and sorting state
        // searchQuery stores the current search term
        // sortBy stores the current sorting option
        // Initially empty strings for no filtering/sorting
        searchQuery: '',
        sortBy: ''
    },
    
    // SECTION 3: VUE 2 COMPUTED PROPERTIES
    // This section handles: Derived state calculations
    // Computed properties are reactive and cached
    // They recalculate only when dependencies change
    // total() calculates sum of all cart items
    computed: {
        // SECTION 3A: CART TOTAL CALCULATION
        // This section handles: Price calculation for cart items with quantities
        // cart.reduce() sums up all item prices multiplied by quantities
        // Extracts numeric value from price string and multiplies by cart quantity
        // Returns total price of all items in cart
        total() {
            const total = this.cart.reduce((sum, item) => {
                // Make sure price is a number - handle only £ currency
                const price = parseFloat(item.price.replace('£', '')); 
                return sum + (price * item.cartQuantity);
            }, 0); // Add missing initial value!
            return total;
        },
        
        // SECTION 3B: FILTERED AND SORTED PRODUCTS
        // This section handles: Product filtering and sorting
        // filteredProducts returns products matching search criteria and sorted
        // Searches in product name and location
        // Sorts by name or price based on sortBy selection
        filteredProducts() {
            let filtered = this.products;
            
            // Apply search filter if searchQuery exists
            if (this.searchQuery) {
                const query = this.searchQuery.toLowerCase();
                filtered = this.products.filter(product => 
                    product.name.toLowerCase().includes(query) ||
                    product.Location.toLowerCase().includes(query)
                );
            }
            
            // Apply sorting if sortBy is selected
            if (this.sortBy) {
                filtered = [...filtered].sort((a, b) => {
                    if (this.sortBy === 'name') {
                        return a.name.localeCompare(b.name);
                    } else if (this.sortBy === 'price') {
                        // Extract numeric value from price string (e.g., "$299" -> 299)
                        const priceA = parseInt(a.price.replace('$', ''));
                        const priceB = parseInt(b.price.replace('$', ''));
                        return priceA - priceB;
                    }
                    return 0;
                });
            }
            
            return filtered;
        }
    },
    
    // SECTION 4: VUE 2 METHODS
    // This section handles: Event handlers and business logic
    // methods object contains all event handlers and functions
    // These are the Controller in MVC pattern
    // All methods have access to this.data and this.computed
    methods: {
        // SECTION 4A: ADD TO CART FUNCTIONALITY
        // This section handles: Adding products to shopping cart with quantities
        // Called when user clicks "Add to Cart" button
        // Checks if product has available spaces for requested quantity
        // Decreases spaces count based on quantity when item is added to cart
        // Modifies reactive data (cart, product.inCart, product.spaces)
        addToCart(product) {
            // Check if product has available spaces for the requested quantity
            if (product.spaces >= product.quantity && product.quantity > 0) {
                // Check if product is already in cart
                const existingItem = this.cart.find(item => item.id === product.id);
                
                if (existingItem) {
                    // If already in cart, increase quantity
                    existingItem.cartQuantity += product.quantity;
                } else {
                    // If not in cart, add new item with cart quantity
                    const cartItem = {
                        ...product,
                        cartQuantity: product.quantity
                    };
                    this.cart.push(cartItem);
                    product.inCart = true;
                }
                
                // Decrease available spaces by quantity
                product.spaces -= product.quantity;
                // Reset quantity to 1 for next purchase
                product.quantity = 1;
                // Save cart to localStorage for persistence
                this.saveCart();
            }
        },
        
        // SECTION 4B: REMOVE FROM CART FUNCTIONALITY
        // This section handles: Removing products from shopping cart
        // Called when user clicks "Remove" button
        // Removes item from cart and increases available spaces by cart quantity
        // Updates product status and spaces count
        removeFromCart(item) {
            // Find index of item in cart array
            const index = this.cart.indexOf(item);
            if (index > -1) {
                // Find the original product to restore spaces
                const originalProduct = this.products.find(p => p.id === item.id);
                if (originalProduct) {
                    // Restore spaces based on cart quantity
                    originalProduct.spaces += item.cartQuantity;
                    // Mark product as not in cart
                    originalProduct.inCart = false;
                }
                
                // Remove item from cart using splice()
                this.cart.splice(index, 1);
                // Save updated cart to localStorage
                this.saveCart();
            }
        },
        
        // SECTION 4C: CART PAGE NAVIGATION
        // This section handles: Navigating to cart page
        // Called when user clicks "View Cart" button
        // Saves cart to localStorage and navigates to cart page
        // This demonstrates multi-page application navigation
        goToCart() {
            // Save cart to localStorage for persistence
            this.saveCart();
            // Navigate to cart page using window.location
            window.location.href = 'cart.html';
        },
        
        // SECTION 4D: CART PERSISTENCE
        // This section handles: Saving cart data to browser storage
        // Saves cart data to browser's localStorage
        // Allows cart to persist between page refreshes
        // Uses JSON.stringify to convert array to string
        saveCart() {
            // Save cart array to localStorage with key 'classCart'
            localStorage.setItem('classCart', JSON.stringify(this.cart));
        }
    }
    
    // SECTION 5: VUE 2 FEATURES NOT USED
    // This section handles: Compliance with requirements
    // No watchers (watch: {})
    // No emits ($emit)
    // No props (props: [])
    // No expose (expose: [])
    // No slots (<slot>)
    // No mixins (mixins: [])
    // No Vuex or Pinia state management
    // No Vue CLI or Vue Router
    // No Composition API (setup, ref, reactive)
    // No Vue 3 features
    // No .vue single file components
    // No <template> tags
});

// SECTION 6: ARCHITECTURE SUMMARY
// This section handles: Complete implementation overview
// 1. Vue 2.7.8 Options API with CDN
// 2. Reactive data binding with {{ }} interpolation
// 3. Event handling with @click directives
// 4. Conditional rendering with v-if directives
// 5. List rendering with v-for directives
// 6. Computed properties for derived state
// 7. Methods for event handling and business logic
// 8. localStorage for data persistence
// 9. Multi-page navigation with window.location
// 10. Simple, defensible implementation using core Vue 2 features only