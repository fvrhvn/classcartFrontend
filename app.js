new Vue({
  el: "#app",

  data: {
    lessons: [],
    cart: [],
    showCart: false,
    searchQuery: "",
    sortAttribute: "",
    sortOrder: "asc",
    checkoutName: "",
    checkoutPhone: "",
    orderMessage: "",
    searching: false
  },

  computed: {
    validCheckout() {
      const nameRegex = /^[A-Za-z\s]+$/;
      const phoneRegex = /^[0-9]+$/;

      return (
        nameRegex.test(this.checkoutName.trim()) &&
        phoneRegex.test(this.checkoutPhone.trim())
      );
    }
  },

  methods: {
    // ✨ NEW: Filter name (letters + spaces only)
    filterName() {
      this.checkoutName = this.checkoutName.replace(/[^A-Za-z\s]/g, "");
    },

    // ✨ NEW: Filter phone (digits only)
    filterPhone() {
      this.checkoutPhone = this.checkoutPhone.replace(/[^0-9]/g, "");
    },

    async fetchLessons() {
      try {
        const res = await fetch("https://classcartserver.onrender.com/api/classes");
        const data = await res.json();
        this.lessons = data;
      } catch (err) {
        console.error("Failed to load lessons", err);
      }
    },

    async fetchCart() {
      try {
        const res = await fetch("https://classcartserver.onrender.com/api/cart");
        const data = await res.json();

        const grouped = {};
        data.forEach(item => {
          if (!grouped[item.classId]) {
            grouped[item.classId] = { ...item, quantity: item.quantity ?? 1 };
          } else {
            grouped[item.classId].quantity += 1;
          }
        });

        this.cart = Object.values(grouped);
      } catch (err) {
        console.error("Failed to load cart", err);
      }
    },

    addToCart(lesson) {
      if (lesson.spaces <= 0) return;
      lesson.spaces--;

      fetch("https://classcartserver.onrender.com/api/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId: lesson.id })
      })
        .then(res => res.json())
        .then(data => {
          this.cart = data;
          window.location.reload();
        })
        .catch(err => console.error("Add to cart failed:", err));
    },

    async deleteFromCart(class_id) {
      const lessonIndex = this.cart.findIndex(l => l.classId === class_id);
      if (lessonIndex === -1) return;

      if (this.cart[lessonIndex].quantity > 1) {
        this.cart[lessonIndex].quantity -= 1;
      } else {
        this.cart.splice(lessonIndex, 1);
      }

      try {
        const res = await fetch(`https://classcartserver.onrender.com/api/cart/decrease/${class_id}`, {
          method: "PUT"
        });
        await res.json();
        this.fetchCart();
        this.fetchLessons();

        if (this.cart.length < 1) {
          window.location.reload();
        }
      } catch (err) {
        console.error("Failed to load lessons", err);
      }
    },

    async searchLessons() {
      if (this.searchQuery.trim() === "") {
        this.fetchLessons();
        return;
      }

      this.searching = true;

      try {
        const res = await fetch(
          `https://classcartserver.onrender.com/api/classes/search?q=${encodeURIComponent(this.searchQuery)}`
        );
        const data = await res.json();
        this.lessons = data;
      } catch (err) {
        console.error("Search failed", err);
      } finally {
        this.searching = false;
      }
    },

    sortLessons() {
      if (!this.sortAttribute) return;

      this.lessons.sort((a, b) => {
        let valueA = a[this.sortAttribute];
        let valueB = b[this.sortAttribute];

        if (typeof valueA === "string") valueA = valueA.toLowerCase();
        if (typeof valueB === "string") valueB = valueB.toLowerCase();

        if (this.sortOrder === "asc") {
          return valueA > valueB ? 1 : -1;
        } else {
          return valueA < valueB ? 1 : -1;
        }
      });
    },

    submitCheckout() {
      this.orderMessage = `Order submitted! Thank you, ${this.checkoutName}. We will contact you at ${this.checkoutPhone}.`;

      const lessonIDs = this.cart.map(item => item.classId);
      const quantities = this.cart.map(item => item.quantity);

      fetch("https://classcartserver.onrender.com/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: this.checkoutName,
          phone: this.checkoutPhone,
          lessonIDs,
          quantities
        })
      })
        .then(res => res.json())
        .then(data => {
          alert(this.orderMessage);
          this.cart = [];
          window.location.reload();
        })
        .catch(err => console.error("Checkout failed", err));
    }
  },

  mounted() {
    this.fetchLessons();
    this.fetchCart();
  }
});
