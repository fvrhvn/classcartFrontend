// SECTION 1: VUE 2.7.8 OPTIONS API IMPLEMENTATION
// This file contains the main Vue instance for the shopping cart
// Uses Vue 2 Options API (not Composition API)
// Demonstrates core Vue 2 features: data, computed, methods

const API_BASE_URL = "http://localhost:3000";

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
        // SECTION 2A: PRODUCTS DATA ARRAY
        // Lessons are fetched from the Express + MongoDB backend and normalized for the UI
        products: [],
        
        // SECTION 2B: SHOPPING CART STATE
        cart: [],
        
        // SECTION 2C: SEARCH AND SORT FUNCTIONALITY
        searchQuery: '',
        sortBy: '',

        // SECTION 2D: API CONFIGURATION AND STATUS FLAGS
        apiBaseUrl: API_BASE_URL,
        isLoadingLessons: false,
        apiError: ''
    },

    // SECTION 2E: LIFECYCLE HOOKS FOR REMOTE DATA
    // created() fetches lessons from the backend as soon as the app boots
    created() {
        this.fetchLessons();
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
                // Prefer numeric prices from the API, otherwise fall back to parsing the £ string
                const price = typeof item.priceValue === 'number'
                    ? item.priceValue
                    : parseFloat((item.price || '').toString().replace('£', ''));
                const quantity = item.cartQuantity || 0;
                return sum + (price * quantity);
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
                    if (this.sortBy === 'subject' || this.sortBy === 'name') {
                        // Sort by subject (name) ascending (A-Z)
                        return a.name.localeCompare(b.name);
                    } else if (this.sortBy === 'subject-desc' || this.sortBy === 'name-desc') {
                        // Sort by subject (name) descending (Z-A)
                        return b.name.localeCompare(a.name);
                    } else if (this.sortBy === 'location') {
                        // Sort by location ascending (A-Z)
                        return a.Location.localeCompare(b.Location);
                    } else if (this.sortBy === 'location-desc') {
                        // Sort by location descending (Z-A)
                        return b.Location.localeCompare(a.Location);
                    } else if (this.sortBy === 'spaces') {
                        // Sort by spaces ascending (Low to High)
                        return a.spaces - b.spaces;
                    } else if (this.sortBy === 'spaces-desc') {
                        // Sort by spaces descending (High to Low)
                        return b.spaces - a.spaces;
                    } else if (this.sortBy === 'price') {
                        // Sort by price ascending (Low to High)
                        // Extract numeric value from price string (e.g., "£299" -> 299)
                        const priceA = parseFloat(a.price.replace('£', ''));
                        const priceB = parseFloat(b.price.replace('£', ''));
                        return priceA - priceB;
                    } else if (this.sortBy === 'price-desc') {
                        // Sort by price descending (High to Low)
                        // Extract numeric value from price string (e.g., "£299" -> 299)
                        const priceA = parseFloat(a.price.replace('£', ''));
                        const priceB = parseFloat(b.price.replace('£', ''));
                        return priceB - priceA;
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
        // SECTION 4A: BACKEND LESSON FETCHING
        // Uses fetch() to load lessons from Express + MongoDB
        async fetchLessons() {
            this.startLessonsFetch();
            try {
                const lessons = await this.requestLessonsFromServer();
                this.products = this.normalizeLessons(lessons);
                this.loadCart();
            } catch (error) {
                this.handleLessonsFetchError(error);
            } finally {
                this.finishLessonsFetch();
            }
        },

        startLessonsFetch() {
            this.isLoadingLessons = true;
            this.apiError = '';
        },

        async requestLessonsFromServer() {
            const response = await fetch(`${this.apiBaseUrl}/lessons`);
            if (!response.ok) {
                throw new Error('Unable to load lessons. Please check the API server.');
            }
            const payload = await response.json();
            if (!payload.success) {
                throw new Error(payload.message || 'Unable to load lessons.');
            }
            return Array.isArray(payload.data) ? payload.data : [];
        },

        normalizeLessons(lessons) {
            return lessons.map(lesson => this.createProductFromLesson(lesson));
        },

        createProductFromLesson(lesson) {
            const normalizedId = normalizeLessonIdValue(lesson && lesson._id);
            return {
                id: normalizedId,
                backendId: normalizedId,
                name: lesson.subject,
                Location: lesson.location,
                image: this.buildImagePath(lesson.image),
                price: this.formatPrice(lesson.price),
                priceValue: typeof lesson.price === 'number' ? lesson.price : parseFloat(lesson.price),
                spaces: typeof lesson.availableSpaces === 'number' ? lesson.availableSpaces : 0,
                quantity: 1,
                inCart: false,
                description: lesson.description || ''
            };
        },

        handleLessonsFetchError(error) {
            console.error('Failed to fetch lessons', error);
            this.apiError = error.message || 'Unable to load lessons.';
        },

        finishLessonsFetch() {
            this.isLoadingLessons = false;
        },

        // SECTION 4B: UI HELPERS
        // formatPrice() ensures consistent £ display
        formatPrice(value) {
            const number = typeof value === 'number' ? value : parseFloat(value);
            if (Number.isNaN(number)) {
                return '£0.00';
            }
            return `£${number.toFixed(2)}`;
        },

        // buildImagePath() maps lesson image filenames to the assets folder
        buildImagePath(filename) {
            if (!filename) {
                return 'assets/logo-python.svg';
            }
            if (filename.startsWith('http')) {
                return filename;
            }
            if (filename.startsWith('assets/')) {
                return filename;
            }
            return `assets/${filename}`;
        },

        // SECTION 4C: LESSON SPACE UPDATES (PUT)
        // updateLessonSpacesOnServer() sends PUT /lessons/:id with the new availability
        async updateLessonSpacesOnServer(lessonId, availableSpaces) {
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

        // SECTION 4D: ADD TO CART FUNCTIONALITY (WITH PUT)
        async addToCart(product) {
            if (!this.canAddProductToCart(product)) {
                return;
            }

            const requestedQuantity = product.quantity;
            const newSpaces = this.calculateReducedSpaces(product, requestedQuantity);
            const lessonId = this.resolveLessonId(product);

            const updated = await this.tryUpdateSpaces(lessonId, newSpaces, {
                log: 'Failed to reserve lesson spaces',
                alert: 'Unable to reserve spaces. Please try again.'
            });

            if (!updated) {
                return;
            }

            this.upsertCartItem(product, requestedQuantity);
            this.finalizeAddToCart(product, newSpaces);
        },

        canAddProductToCart(product) {
            return product && product.quantity > 0 && product.quantity <= product.spaces;
        },

        calculateReducedSpaces(product, requestedQuantity) {
            return product.spaces - requestedQuantity;
        },

        resolveLessonId(item) {
            if (!item) {
                return '';
            }

            const candidate =
                item.backendId ||
                item.id ||
                item._id ||
                item.lessonId ||
                item.lessonID ||
                null;

            return normalizeLessonIdValue(candidate);
        },

        async tryUpdateSpaces(lessonId, availableSpaces, messages) {
            try {
                await this.updateLessonSpacesOnServer(lessonId, availableSpaces);
                return true;
            } catch (error) {
                console.error(messages.log, error);
                alert(messages.alert);
                return false;
            }
        },

        upsertCartItem(product, requestedQuantity) {
            const normalizedLessonId = this.resolveLessonId(product);
            if (!normalizedLessonId) {
                console.warn('upsertCartItem: Unable to resolve lesson ID for product', product);
                return;
            }

            const existingItem = this.cart.find(item => this.resolveLessonId(item) === normalizedLessonId);
            if (existingItem) {
                existingItem.cartQuantity += requestedQuantity;
                return;
            }

            this.cart.push({
                id: normalizedLessonId,
                backendId: normalizedLessonId,
                name: product.name,
                Location: product.Location,
                price: product.price,
                priceValue: product.priceValue,
                image: product.image,
                cartQuantity: requestedQuantity
            });
            product.inCart = true;
            product.id = normalizedLessonId;
            product.backendId = normalizedLessonId;
        },

        finalizeAddToCart(product, newSpaces) {
            const normalizedLessonId = this.resolveLessonId(product);
            if (normalizedLessonId) {
                product.id = normalizedLessonId;
                product.backendId = normalizedLessonId;
            }
            product.spaces = newSpaces;
            product.quantity = 1;
            this.saveCart();
        },

        // SECTION 4E: REMOVE FROM CART (NOT VISIBLE IN UI BUT SUPPORTED)
        async removeFromCart(item) {
            if (!item) {
                return;
            }

            const lessonId = this.resolveLessonId(item);
            const product = this.products.find(p => this.resolveLessonId(p) === lessonId);
            const restoredSpaces = this.calculateRestoredSpaces(product, item);

            const updated = await this.tryUpdateSpaces(lessonId, restoredSpaces, {
                log: 'Failed to restore lesson spaces',
                alert: 'Unable to restore lesson availability. Please try again.'
            });

            if (!updated) {
                return;
            }

            this.applyRestoredProductState(product, restoredSpaces);
            this.removeCartItemFromState(lessonId);
            this.saveCart();
        },

        calculateRestoredSpaces(product, cartItem) {
            const normalizedCartId = normalizeLessonIdValue(
                cartItem
                    ? (
                        cartItem.backendId ||
                        cartItem.id ||
                        cartItem._id ||
                        cartItem.lessonId ||
                        cartItem.lessonID
                    )
                    : null
            );

            this._lastRemovalLessonId = normalizedCartId || null;

            let resolvedProduct = product;
            if (!resolvedProduct && normalizedCartId) {
                resolvedProduct = this.products.find(candidate => {
                    const candidateId = normalizeLessonIdValue(
                        candidate
                            ? (
                                candidate.backendId ||
                                candidate.id ||
                                candidate._id
                            )
                            : null
                    );
                    return candidateId === normalizedCartId;
                });
            }

            const quantityValue = Number(cartItem && cartItem.cartQuantity);
            const quantity = Number.isFinite(quantityValue) ? quantityValue : 0;

            const spacesValue = Number(resolvedProduct && resolvedProduct.spaces);
            const spaces = Number.isFinite(spacesValue) ? spacesValue : 0;

            return spaces + quantity;
        },

        applyRestoredProductState(product, restoredSpaces) {
            let targetProduct = product || null;
            let normalizedLessonId = targetProduct
                ? normalizeLessonIdValue(targetProduct.id || targetProduct.backendId || targetProduct._id)
                : '';

            if (!normalizedLessonId) {
                normalizedLessonId = this._lastRemovalLessonId || '';
            }

            if (!targetProduct && normalizedLessonId) {
                targetProduct = this.products.find(candidate => {
                    const candidateId = normalizeLessonIdValue(
                        candidate
                            ? (
                                candidate.backendId ||
                                candidate.id ||
                                candidate._id
                            )
                            : null
                    );
                    return candidateId === normalizedLessonId;
                });
            }

            if (!targetProduct) {
                this._lastRemovalLessonId = null;
                return;
            }

            targetProduct.spaces = restoredSpaces;

            const stillInCart = this.cart.some(cartItem => {
                const cartId = normalizeLessonIdValue(cartItem.id || cartItem.backendId || cartItem._id);
                return cartId === normalizedLessonId;
            });

            targetProduct.inCart = stillInCart;

            if (!stillInCart) {
                targetProduct.quantity = 1;
            }

            this._lastRemovalLessonId = null;
        },

        removeCartItemFromState(itemId) {
            const normalizedTargetId = normalizeLessonIdValue(itemId);
            const index = this.cart.findIndex(cartItem => {
                const cartId = normalizeLessonIdValue(cartItem.id || cartItem.backendId || cartItem._id);
                return cartId === normalizedTargetId;
            });

            if (index > -1) {
                this.cart.splice(index, 1);
            }
        },

        // SECTION 4F: CART PAGE NAVIGATION
        goToCart() {
            if (this.cart.length === 0) {
                return;
            }
            this.saveCart();
            window.location.href = 'cart.html';
        },

        // SECTION 4G: CART PERSISTENCE
        saveCart() {
            const sanitizedCart = this.buildCartStoragePayload();
            localStorage.setItem('classCart', JSON.stringify(sanitizedCart));
        },

        buildCartStoragePayload() {
            return this.cart.map(item => {
                const normalizedLessonId = this.resolveLessonId(item);
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

        // SECTION 4H: LOAD CART FROM STORAGE
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
            this.flagProductsInCart();
        },

        getSavedCart() {
            return localStorage.getItem('classCart');
        },

        parseSavedCart(savedCart) {
            try {
                return JSON.parse(savedCart);
            } catch (error) {
                console.error('Failed to load cart from storage', error);
                return null;
            }
        },

        decorateCartItem(item) {
            const normalizedLessonId = normalizeLessonIdValue(item && (item.backendId || item.id || item._id));
            return {
                id: normalizedLessonId,
                backendId: normalizedLessonId,
                name: item.name,
                Location: item.Location,
                price: item.price,
                priceValue: item.priceValue,
                image: item.image,
                cartQuantity: item.cartQuantity || 1
            };
        },

        flagProductsInCart() {
            this.cart.forEach(cartItem => {
                const cartItemId = this.resolveLessonId(cartItem);
                const product = this.products.find(p => this.resolveLessonId(p) === cartItemId);
                if (product) {
                    product.inCart = true;
                    product.quantity = 1;
                }
            });
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