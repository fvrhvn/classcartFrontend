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

function normalizeLessonIdValue(rawId) {
    if (rawId === undefined || rawId === null) {
        return '';
    }

    if (typeof rawId === 'string') {
        return rawId.trim();
    }

    if (typeof rawId === 'number') {
        return String(rawId);
    }

    if (typeof rawId === 'object') {
        if (typeof rawId.$oid === 'string') {
            return rawId.$oid;
        }
        if (rawId._id !== undefined) {
            return normalizeLessonIdValue(rawId._id);
        }
        if (typeof rawId.toHexString === 'function') {
            return rawId.toHexString();
        }
        if (typeof rawId.toString === 'function') {
            const objectString = rawId.toString();
            if (objectString && objectString !== '[object Object]') {
                return objectString;
            }
        }
    }

    return String(rawId);
}

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
        // SECTION 4A: REMOVE FROM CART FUNCTIONALITY (WITH PUT + OFFLINE FALLBACK)
        async removeFromCart(item) {
            if (!this.canRemoveCartItem(item)) {
                console.warn('[Cart] removeFromCart called with invalid item', item);
                return;
            }

            const lessonId = this.resolveLessonId(item);
            const cartBefore = this.cart.map(cartItem => this.buildCartItemLogSnapshot(cartItem));
            console.log('[Cart] removeFromCart:start', {
                lessonId,
                cartBefore,
                selectedItem: this.buildCartItemLogSnapshot(item)
            });

            const restoreResult = await this.tryRestoreSpacesForRemoval(item, lessonId);
            if (!restoreResult.success) {
                this.notifyRestoreFailure(restoreResult.error, restoreResult.lessonId || lessonId);
                return;
            }

            this.removeCartItemByReference(item);

            const cartAfter = this.cart.map(cartItem => this.buildCartItemLogSnapshot(cartItem));
            console.log('[Cart] removeFromCart:afterRemoval', {
                lessonId: restoreResult.lessonId || lessonId,
                cartAfter
            });

            this.saveCart();
        },

        canRemoveCartItem(item) {
            return Boolean(item);
        },

        async tryRestoreSpacesForRemoval(item, providedLessonId) {
            const lessonId = providedLessonId || this.resolveLessonId(item);
            console.log('[Cart] tryRestoreSpacesForRemoval:start', {
                lessonId,
                itemSnapshot: this.buildCartItemLogSnapshot(item)
            });

            if (!lessonId) {
                const error = new Error('Unable to determine lesson ID for removal.');
                console.error('[Cart] Missing lessonId for removal', {
                    itemSnapshot: this.buildCartItemLogSnapshot(item)
                });
                return { success: false, error, lessonId: null };
            }

            try {
                await this.restoreSpacesForItem(lessonId, item);
                console.log('[Cart] tryRestoreSpacesForRemoval:success', { lessonId });
                return { success: true, lessonId };
            } catch (error) {
                console.error('[Cart] tryRestoreSpacesForRemoval:failure', { lessonId, error });
                return { success: false, error, lessonId };
            }
        },

        notifyRestoreFailure(error, lessonId) {
            console.error('[Cart] removeFromCart aborted', { lessonId, error });
            const baseMessage = 'Unable to remove this lesson because we could not restore its availability.';
            const lessonInfo = lessonId ? ` (lessonId: ${lessonId})` : '';
            const reason = error && error.message ? ` Reason: ${error.message}` : '';
            alert(`${baseMessage}${lessonInfo}${reason}`);
        },

        removeCartItemByReference(item) {
            const index = this.cart.indexOf(item);
            if (index > -1) {
                this.cart.splice(index, 1);
                console.log('[Cart] removeCartItemByReference: removed item at index', index);
            } else {
                console.warn('[Cart] removeCartItemByReference: item not found in cart', this.buildCartItemLogSnapshot(item));
            }
        },
        
        // SECTION 4B: CART PERSISTENCE
        saveCart() {
            const sanitizedCart = this.buildCartStoragePayload();
            console.log('[Cart] saveCart:payload', sanitizedCart);
            localStorage.setItem('classCart', JSON.stringify(sanitizedCart));
        },

        buildCartStoragePayload() {
            return this.cart.map(item => {
                const normalizedLessonId = normalizeLessonIdValue(item && (item.backendId || item.id || item._id));
                return {
                    id: normalizedLessonId,
                    backendId: normalizedLessonId,
                    name: item.name,
                    Location: item.Location,
                    price: item.price,
                    priceValue: item.priceValue,
                    image: item.image,
                    cartQuantity: item.cartQuantity
                };
            });
        },

        buildCartItemLogSnapshot(item) {
            if (!item) {
                return null;
            }
            return {
                id: item.id || null,
                backendId: item.backendId || null,
                cartQuantity: typeof item.cartQuantity === 'number' ? item.cartQuantity : Number(item.cartQuantity) || 0,
                name: item.name || ''
            };
        },
        
        // SECTION 4C: LOAD CART FROM STORAGE
        loadCart() {
            const savedCart = this.getSavedCart();
            if (!savedCart) {
                return;
            }

            const parsedCart = this.parseSavedCart(savedCart);
            if (!Array.isArray(parsedCart)) {
                return;
            }

            this.cart = parsedCart.map(item => this.decorateCartItem(item));
        },

        getSavedCart() {
            return localStorage.getItem('classCart');
        },

        parseSavedCart(savedCart) {
            try {
                return JSON.parse(savedCart);
            } catch (error) {
                console.error('[Cart] Failed to load cart from storage', error);
                return null;
            }
        },

        decorateCartItem(item) {
            const normalizedLessonId = normalizeLessonIdValue(item && (item.backendId || item.id || item._id));
            return {
                ...item,
                id: normalizedLessonId,
                backendId: normalizedLessonId,
                cartQuantity: item.cartQuantity || 1
            };
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
            this.resetValidationState();
            const nameRegex = /^[A-Za-z\s]+$/;
            const firstValid = this.validateNameField('firstName', 'First name', nameRegex);
            const lastValid = this.validateNameField('lastName', 'Last name', nameRegex);
            const phoneValid = this.validatePhoneField();
            return firstValid && lastValid && phoneValid;
        },

        resetValidationState() {
            this.validationErrors = {};
        },

        validateNameField(fieldKey, label, nameRegex) {
            const value = this.checkoutForm[fieldKey].trim();
            if (!value) {
                this.validationErrors[fieldKey] = `${label} is required`;
                return false;
            }
            if (!nameRegex.test(value)) {
                this.validationErrors[fieldKey] = `${label} can contain letters and spaces only`;
                return false;
            }
            return true;
        },

        validatePhoneField() {
            const value = this.checkoutForm.phone.trim();
            if (!value) {
                this.validationErrors.phone = 'Phone number is required';
                return false;
            }
            if (!/^\d+$/.test(value)) {
                this.validationErrors.phone = 'Phone number must contain digits only';
                return false;
            }
            return true;
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

            if (!this.hasCartItemsForCheckout()) {
                alert('Your cart is empty. Add lessons before checking out.');
                return;
            }
            
            const customerSnapshot = this.buildCustomerSnapshot();
            const displayName = this.buildCustomerDisplayName(customerSnapshot);
            const orderTotal = this.total;
            const orderPayload = this.buildOrderPayload(displayName, customerSnapshot.phone);

            this.startCheckoutSubmission();
            
            try {
                await this.createOrder(orderPayload);
                this.handleCheckoutSuccess(customerSnapshot, displayName, orderTotal);
            } catch (error) {
                this.handleCheckoutError(error);
            } finally {
                this.finishCheckoutSubmission();
            }
        },

        hasCartItemsForCheckout() {
            return this.cart.length > 0;
        },

        buildCustomerSnapshot() {
            return {
                firstName: this.checkoutForm.firstName.trim(),
                lastName: this.checkoutForm.lastName.trim(),
                phone: this.checkoutForm.phone.trim()
            };
        },

        buildCustomerDisplayName(customerSnapshot) {
            return `${customerSnapshot.firstName} ${customerSnapshot.lastName}`.trim();
        },

        buildOrderPayload(displayName, phone) {
            return {
                name: displayName,
                phone,
                lessonIDs: this.cart
                    .map(item => normalizeLessonIdValue(item && (item.backendId || item.id || item._id)))
                    .filter(id => Boolean(id)),
                numberOfSpaces: this.cart.reduce((sum, item) => sum + (item.cartQuantity || 0), 0)
            };
        },

        startCheckoutSubmission() {
            this.isSubmitting = true;
            this.checkoutSuccess = false;
        },

        handleCheckoutSuccess(customerSnapshot, displayName, orderTotal) {
            const normalizedTotal = Number(orderTotal);
            const safeTotal = Number.isFinite(normalizedTotal) ? normalizedTotal : 0;
            const finalDisplayName = (displayName || this.buildCustomerDisplayName(customerSnapshot) || 'Customer').trim() || 'Customer';

            this.lastOrderSummary = {
                ...customerSnapshot,
                displayName: finalDisplayName,
                total: safeTotal
            };

            this.checkoutSuccess = false;
            this.checkoutSuccess = true;
            this.cart = [];
            this.saveCart();
            this.checkoutForm = { firstName: '', lastName: '', phone: '' };
            this.validationErrors = {};
            alert(`Checkout successful! Thank you for your purchase, ${finalDisplayName}!`);
        },

        handleCheckoutError(error) {
            console.error('Checkout failed', error);
            alert(error.message || 'Unable to submit your order. Please try again.');
        },

        finishCheckoutSubmission() {
            this.isSubmitting = false;
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

        async restoreSpacesForItem(lessonId, item) {
            console.log('[Cart] restoreSpacesForItem:start', {
                lessonId,
                quantityToRestore: item ? item.cartQuantity : null
            });
            const lesson = await this.fetchLessonById(lessonId);
            const updatedSpaces = this.calculateUpdatedSpacesForRestoration(lesson, item);
            console.log('[Cart] restoreSpacesForItem:calculated', {
                lessonId,
                currentSpaces: lesson ? lesson.availableSpaces : null,
                updatedSpaces
            });
            await this.updateLessonSpaces(lessonId, updatedSpaces);
        },

        resolveLessonId(item) {
            if (!item) {
                return null;
            }

            const candidate =
                item.backendId ||
                item.backendID ||
                item.id ||
                item._id ||
                item.lessonId ||
                item.lessonID ||
                null;

            const normalized = normalizeLessonIdValue(candidate);

            if (!normalized) {
                console.warn('[Cart] resolveLessonId: missing identifier on cart item', item);
                return null;
            }

            return normalized;
        },

        calculateUpdatedSpacesForRestoration(lesson, item) {
            const lessonSpacesValue = Number(lesson && lesson.availableSpaces);
            const currentSpaces = Number.isFinite(lessonSpacesValue) ? lessonSpacesValue : 0;
            const quantityValue = Number(item && item.cartQuantity);
            const quantityToRestore = Number.isFinite(quantityValue) ? quantityValue : 0;
            const updatedSpaces = currentSpaces + quantityToRestore;

            console.log('[Cart] calculateUpdatedSpacesForRestoration', {
                currentSpaces,
                quantityToRestore,
                updatedSpaces
            });

            return updatedSpaces;
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

