// SECTION 1: VUE 2.7.8 OPTIONS API IMPLEMENTATION FOR CHECKOUT PAGE
// This file contains the main Vue instance for the checkout page
// Uses Vue 2 Options API (not Composition API)
// Demonstrates core Vue 2 features: data, computed, methods, mounted lifecycle

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
        // checkoutForm stores all form input values
        // Each property corresponds to a form field
        // All fields are required for checkout completion
        checkoutForm: {
            name: '',        // Customer's full name
            email: '',       // Customer's email address
            phone: '',       // Customer's phone number
            address: '',     // Customer's delivery address
            payment: ''      // Selected payment method
        }
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
        // SECTION 4A: LOAD CART FROM STORAGE
        // This section handles: Loading cart data from browser storage
        // Loads cart data from localStorage on page load
        // Uses JSON.parse to convert string back to array
        // This ensures cart persists between page refreshes
        loadCart() {
            // Get saved cart from localStorage
            const savedCart = localStorage.getItem('classCart');
            if (savedCart) {
                // Convert JSON string back to array
                this.cart = JSON.parse(savedCart);
            }
        },
        
        // SECTION 4B: NAVIGATION BACK TO CART
        // This section handles: Navigating back to main products page
        // Called when user clicks "Back to Cart" button
        // Uses window.location.href for page navigation
        // This demonstrates simple multi-page navigation
        goBackToCart() {
            // Navigate back to main products page
            window.location.href = 'index.html';
        },
        
        // SECTION 4C: CHECKOUT ORDER COMPLETION
        // This section handles: Processing checkout form submission
        // Validates form fields and cart contents
        // Shows order confirmation and clears cart
        // This is the main checkout processing logic
        completeOrder() {
            // SECTION 4C1: FORM VALIDATION
            // This section handles: Checking if all required fields are filled
            // Validates each required field in checkoutForm
            // Shows alert if any field is missing
            if (!this.checkoutForm.name || 
                !this.checkoutForm.email || 
                !this.checkoutForm.phone || 
                !this.checkoutForm.address || 
                !this.checkoutForm.payment) {
                alert('Please fill in all required fields');
                return; // Stop execution if validation fails
            }
            
            // SECTION 4C2: CART VALIDATION
            // This section handles: Checking if cart has items
            // Prevents checkout with empty cart
            // Redirects to products page if cart is empty
            if (this.cart.length === 0) {
                alert('Your cart is empty. Please add some items first.');
                window.location.href = 'index.html';
                return; // Stop execution if cart is empty
            }
            
            // SECTION 4C3: ORDER CONFIRMATION
            // This section handles: Showing order confirmation details
            // Displays customer info, total, and payment method
            // Uses template literals for clean string formatting
            alert('Order completed successfully!\n\n' +
                  'Customer: ' + this.checkoutForm.name + '\n' +
                  'Email: ' + this.checkoutForm.email + '\n' +
                  'Total: $' + this.total + '\n' +
                  'Payment: ' + this.checkoutForm.payment);
            
            // SECTION 4C4: CART CLEARING AND REDIRECT
            // This section handles: Clearing cart and redirecting
            // Removes cart from localStorage (order is complete)
            // Redirects to main products page
            localStorage.removeItem('classCart');
            window.location.href = 'index.html';
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
// 4. Form binding with v-model directives
// 5. List rendering with v-for directives
// 6. Computed properties for derived state
// 7. Methods for event handling and business logic
// 8. localStorage for data persistence
// 9. Multi-page navigation with window.location
// 10. Simple, defensible implementation using core Vue 2 features only
