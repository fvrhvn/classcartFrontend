// SECTION 1: VUE 2.7.8 OPTIONS API IMPLEMENTATION FOR CART PAGE
// This file contains the main Vue instance for the shopping cart page
// Uses Vue 2 Options API (not Composition API)
// Demonstrates core Vue 2 features: data, computed, methods
function deriveDefaultApiBase() {
    const { protocol, hostname } = window.location;
    const safeProtocol = protocol && protocol.startsWith('http') ? protocol : 'http:';
    const safeHost = hostname || 'localhost';
    const defaultPort = 3000;
    return `${safeProtocol}//${safeHost}:${defaultPort}`;
}

const API_BASE_URL = window.CLASSCART_API_BASE_URL || deriveDefaultApiBase();

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
            firstName: '',
            lastName: '',
            phone: ''
        },
        validationErrors: {},
        checkoutSuccess: false,
        isSubmitting: false,
        lastOrderSummary: null,
        apiBaseUrl: API_BASE_URL
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
                const price = typeof item.priceValue === 'number'
                    ? item.priceValue
                    : parseFloat((item.price || '').toString().replace('£', ''));
                const quantity = item.cartQuantity || 0;
                return sum + (price * quantity);
            }, 0);
            return total;
        },

        // SECTION 3B: CHECKOUT BUTTON STATE
        // Ensures the checkout button only becomes active when all inputs are valid
        canSubmitCheckout() {
            const firstValue = this.checkoutForm.firstName.trim();
            const lastValue = this.checkoutForm.lastName.trim();
            const phoneValue = this.checkoutForm.phone.trim();
            const nameRegex = /^[A-Za-z\s]+$/;
            const firstValid = firstValue.length > 0 && nameRegex.test(firstValue);
            const lastValid = lastValue.length > 0 && nameRegex.test(lastValue);
            const phoneValid = phoneValue.length > 0 && /^\d+$/.test(phoneValue);
            return firstValid && lastValid && phoneValid && this.cart.length > 0;
        }
    },
    
    // SECTION 4: VUE 2 METHODS
    // This section handles: Event handlers and business logic
    // methods object contains all event handlers and functions
    // These are the Controller in MVC pattern
    // All methods have access to this.data and this.computed
    methods: {
        // SECTION 4A: REMOVE FROM CART FUNCTIONALITY (WITH PUT)
        async removeFromCart(item) {
            if (!item) {
                return;
            }

            try {
                await this.restoreSpacesForItem(item);
            } catch (error) {
                console.error('Failed to restore lesson availability', error);
                alert(error.message || 'Unable to restore lesson availability. Please try again.');
                return;
            }

            const index = this.cart.indexOf(item);
            if (index > -1) {
                this.cart.splice(index, 1);
                this.saveCart();
            }
        },
        
        // SECTION 4B: CART PERSISTENCE
        saveCart() {
            const sanitizedCart = this.cart.map(item => ({
                id: item.id,
                backendId: item.backendId || item.id,
                name: item.name,
                Location: item.Location,
                price: item.price,
                priceValue: item.priceValue,
                image: item.image,
                cartQuantity: item.cartQuantity
            }));
            localStorage.setItem('classCart', JSON.stringify(sanitizedCart));
        },
        
        // SECTION 4C: LOAD CART FROM STORAGE
        loadCart() {
            const savedCart = localStorage.getItem('classCart');
            if (!savedCart) {
                return;
            }

            try {
                const parsedCart = JSON.parse(savedCart);
                if (!Array.isArray(parsedCart)) {
                    return;
                }

                this.cart = parsedCart.map(item => ({
                    ...item,
                    backendId: item.backendId || item.id,
                    cartQuantity: item.cartQuantity || 1
                }));
            } catch (error) {
                console.error('Failed to load cart from storage', error);
            }
        },
        
        // SECTION 4D: NAVIGATION TO PRODUCTS PAGE
        goToProducts() {
            this.saveCart();
            window.location.href = 'index.html';
        },

        // SECTION 4E: INPUT SANITIZATION
        filterPhone(event) {
            const digitsOnly = (event.target.value || '').replace(/\D/g, '');
            this.checkoutForm.phone = digitsOnly;
        },
        
        // SECTION 4F: CHECKOUT FORM VALIDATION
        validateCheckoutForm() {
            this.validationErrors = {};
            let isValid = true;
            const nameRegex = /^[A-Za-z\s]+$/;
            
            if (!this.checkoutForm.firstName.trim()) {
                this.validationErrors.firstName = 'First name is required';
                isValid = false;
            } else if (!nameRegex.test(this.checkoutForm.firstName.trim())) {
                this.validationErrors.firstName = 'First name can contain letters and spaces only';
                isValid = false;
            }

            if (!this.checkoutForm.lastName.trim()) {
                this.validationErrors.lastName = 'Last name is required';
                isValid = false;
            } else if (!nameRegex.test(this.checkoutForm.lastName.trim())) {
                this.validationErrors.lastName = 'Last name can contain letters and spaces only';
                isValid = false;
            }
            
            if (!this.checkoutForm.phone.trim()) {
                this.validationErrors.phone = 'Phone number is required';
                isValid = false;
            } else if (!/^\d+$/.test(this.checkoutForm.phone.trim())) {
                this.validationErrors.phone = 'Phone number must contain digits only';
                isValid = false;
            }
            
            return isValid;
        },
        
        formatPrice(value) {
            const number = typeof value === 'number' ? value : parseFloat(value);
            if (Number.isNaN(number)) {
                return '£0.00';
            }
            return `£${number.toFixed(2)}`;
        },

        // SECTION 4G: CHECKOUT SUBMISSION (POST /orders)
        async submitCheckout() {
            if (this.isSubmitting) {
                return;
            }
            
            if (!this.validateCheckoutForm()) {
                return;
            }

            if (this.cart.length === 0) {
                alert('Your cart is empty. Add lessons before checking out.');
                return;
            }
            
            this.isSubmitting = true;
            this.checkoutSuccess = false;
            const customerSnapshot = {
                firstName: this.checkoutForm.firstName.trim(),
                lastName: this.checkoutForm.lastName.trim(),
                phone: this.checkoutForm.phone.trim()
            };
            const displayName = `${customerSnapshot.firstName} ${customerSnapshot.lastName}`.trim();
            const orderTotal = this.total;
            const orderPayload = {
                name: displayName,
                phone: customerSnapshot.phone,
                lessonIDs: this.cart.map(item => item.backendId || item.id),
                numberOfSpaces: this.cart.reduce((sum, item) => sum + (item.cartQuantity || 0), 0)
            };
            
            try {
                await this.createOrder(orderPayload);
                
                this.lastOrderSummary = {
                    ...customerSnapshot,
                    displayName,
                    total: orderTotal
                };
                this.checkoutSuccess = true;
                this.cart = [];
                this.saveCart();
                this.checkoutForm = { firstName: '', lastName: '', phone: '' };
                this.validationErrors = {};
                
                alert(`Checkout successful! Thank you for your purchase, ${displayName || 'Customer'}!`);
            } catch (error) {
                console.error('Checkout failed', error);
                alert(error.message || 'Unable to submit your order. Please try again.');
            } finally {
                this.isSubmitting = false;
            }
        },

        // SECTION 4H: ORDER CREATION VIA FETCH POST
        async createOrder(orderPayload) {
            const response = await fetch(`${this.apiBaseUrl}/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(orderPayload)
            });
            const payload = await response.json();
            if (!response.ok || !payload.success) {
                throw new Error(payload.message || 'Unable to create order.');
            }
            return payload.data;
        },

        // SECTION 4I: LESSON HELPERS FOR SPACE RESTORATION
        async fetchLessonById(lessonId) {
            const response = await fetch(`${this.apiBaseUrl}/lessons/${lessonId}`);
            const payload = await response.json();
            if (!response.ok || !payload.success) {
                throw new Error(payload.message || 'Unable to fetch lesson details.');
            }
            return payload.data;
        },

        async updateLessonSpaces(lessonId, availableSpaces) {
            const response = await fetch(`${this.apiBaseUrl}/lessons/${lessonId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ availableSpaces })
            });
            const payload = await response.json();
            if (!response.ok || !payload.success) {
                throw new Error(payload.message || 'Unable to update lesson availability.');
            }
            return payload.data;
        },

        async restoreSpacesForItem(item) {
            const lessonId = item.backendId || item.id;
            const lesson = await this.fetchLessonById(lessonId);
            const currentSpaces = typeof lesson.availableSpaces === 'number' ? lesson.availableSpaces : 0;
            const updatedSpaces = currentSpaces + (item.cartQuantity || 0);
            await this.updateLessonSpaces(lessonId, updatedSpaces);
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

