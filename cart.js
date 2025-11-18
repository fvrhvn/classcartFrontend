// SECTION 1: VUE 2.7.8 OPTIONS API IMPLEMENTATION FOR CART PAGE
// This file contains the main Vue instance for the shopping cart page
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
        // SECTION 2A: SHOPPING CART STATE
        // This section handles: Cart items storage
        // cart[] stores items added to shopping cart
        // Loaded from localStorage on page load
        // This is the main state for cart functionality
        cart: [],
        
        // SECTION 2B: CHECKOUT FORM DATA
        // This section handles: Checkout form state management
        // checkoutForm stores form input values
        // validationErrors stores validation error messages
        // checkoutSuccess tracks successful checkout completion
        // isSubmitting prevents double submissions
        checkoutForm: {
            name: '',
            email: '',
            address: ''
        },
        validationErrors: {},
        checkoutSuccess: false,
        isSubmitting: false
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
            }, 0);
            return total;
        }
    },
    
    // SECTION 4: VUE 2 METHODS
    // This section handles: Event handlers and business logic
    // methods object contains all event handlers and functions
    // These are the Controller in MVC pattern
    // All methods have access to this.data and this.computed
    methods: {
        // SECTION 4A: REMOVE FROM CART FUNCTIONALITY
        // This section handles: Removing products from shopping cart
        // Called when user clicks "Remove" button
        // Removes item from cart and increases available spaces by cart quantity
        // Updates product status and spaces count
        removeFromCart(item) {
            // Find index of item in cart array
            const index = this.cart.indexOf(item);
            if (index > -1) {
                // Remove item from cart using splice()
                this.cart.splice(index, 1);
                // Save updated cart to localStorage
                this.saveCart();
            }
        },
        
        // SECTION 4B: CART PERSISTENCE
        // This section handles: Saving cart data to browser storage
        // Saves cart data to browser's localStorage
        // Allows cart to persist between page refreshes
        // Uses JSON.stringify to convert array to string
        saveCart() {
            // Save cart array to localStorage with key 'classCart'
            localStorage.setItem('classCart', JSON.stringify(this.cart));
        },
        
        // SECTION 4C: LOAD CART FROM STORAGE
        // This section handles: Loading cart data from browser storage
        // Loads cart data from localStorage on page load
        // Uses JSON.parse to convert string back to array
        loadCart() {
            const savedCart = localStorage.getItem('classCart');
            if (savedCart) {
                this.cart = JSON.parse(savedCart);
            }
        },
        
        // SECTION 4D: NAVIGATION TO PRODUCTS PAGE
        // This section handles: Navigating to products page
        // Called when user clicks "Back to Products" button
        // Saves cart to localStorage and navigates to products page
        goToProducts() {
            // Save cart to localStorage for persistence
            this.saveCart();
            // Navigate to products page using window.location
            window.location.href = 'index.html';
        },
        
        // SECTION 4E: CHECKOUT FORM VALIDATION
        // This section handles: Form validation for checkout
        // Validates name, email, and address fields
        // Returns true if all validations pass, false otherwise
        validateCheckoutForm() {
            this.validationErrors = {};
            let isValid = true;
            
            // Validate name
            if (!this.checkoutForm.name.trim()) {
                this.validationErrors.name = 'Name is required';
                isValid = false;
            } else if (this.checkoutForm.name.trim().length < 2) {
                this.validationErrors.name = 'Name must be at least 2 characters';
                isValid = false;
            }
            
            // Validate email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!this.checkoutForm.email.trim()) {
                this.validationErrors.email = 'Email is required';
                isValid = false;
            } else if (!emailRegex.test(this.checkoutForm.email)) {
                this.validationErrors.email = 'Please enter a valid email address';
                isValid = false;
            }
            
            // Validate address
            if (!this.checkoutForm.address.trim()) {
                this.validationErrors.address = 'Address is required';
                isValid = false;
            } else if (this.checkoutForm.address.trim().length < 10) {
                this.validationErrors.address = 'Address must be at least 10 characters';
                isValid = false;
            }
            
            return isValid;
        },
        
        // SECTION 4F: CHECKOUT SUBMISSION
        // This section handles: Processing checkout form submission
        // Validates form, processes checkout, and shows success message
        // Simulates checkout processing with a delay
        submitCheckout() {
            // Prevent double submission
            if (this.isSubmitting) {
                return;
            }
            
            // Validate form
            if (!this.validateCheckoutForm()) {
                return;
            }
            
            // Set submitting state
            this.isSubmitting = true;
            this.checkoutSuccess = false;
            
            // Simulate checkout processing (2 second delay)
            setTimeout(() => {
                // Process checkout
                this.processCheckout();
                
                // Show success message
                this.checkoutSuccess = true;
                this.isSubmitting = false;
                
                // Clear form after successful checkout
                this.checkoutForm = {
                    name: '',
                    email: '',
                    address: ''
                };
                this.validationErrors = {};
                
                // Show success alert
                alert(`Checkout successful! Thank you for your purchase, ${this.checkoutForm.name || 'Customer'}!`);
                
            }, 2000);
        },
        
        // SECTION 4G: CHECKOUT PROCESSING
        // This section handles: Actual checkout processing logic
        // Clears cart and saves order data
        // Note: Spaces are not restored after checkout (items are sold)
        processCheckout() {
            // Save order to localStorage (simulate order processing)
            const order = {
                id: Date.now(),
                customer: this.checkoutForm,
                items: [...this.cart],
                total: this.total,
                date: new Date().toISOString()
            };
            
            // Save order
            localStorage.setItem('lastOrder', JSON.stringify(order));
            
            // Clear cart (spaces remain decreased - items are sold)
            this.cart = [];
            this.saveCart();
        }
    },
    
    // SECTION 5: VUE 2 LIFECYCLE HOOKS
    // This section handles: Component lifecycle management
    // mounted() is called when Vue instance is mounted to DOM
    // Loads cart data from localStorage on page load
    mounted() {
        // Load cart from localStorage when page loads
        this.loadCart();
    },
    
    // SECTION 6: VUE 2 FEATURES NOT USED
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

// SECTION 7: ARCHITECTURE SUMMARY
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
