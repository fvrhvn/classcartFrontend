    const { createApp } = Vue;

    createApp({
      data() {
        return {
          lessons: [],
          cart: [],
          showCart: false,
          searchQuery:"",
          sortAttribute: "",
          sortOrder: "asc",
          checkoutName: "",
          checkoutPhone: "",
          orderMessage: "",


        };
      },
      methods: {
        async fetchLessons() {
          try {
            const res = await fetch("http://localhost:5000/api/classes");
            console.log("response", res)
            const data = await res.json();
            this.lessons = data;
          } catch (err) {
            console.error("Failed to load lessons", err);
          }
        },
           async deleteFromCart(class_id) {
            console.log("class_id", class_id)
             const lessonIndex = this.cart.findIndex(l => l.classId === class_id);
                if (lessonIndex === -1) return;

                if (this.cart[lessonIndex].quantity > 1) {
                    this.cart[lessonIndex].quantity -= 1;
                } else {
                    this.cart.splice(lessonIndex, 1);
                }
          try {
            const res = await fetch(`http://localhost:5000/api/cart/decrease/${class_id}`,{
                method:"PUT"
            });
            console.log("response", res)
            this.fetchCart()
            this.fetchLessons()
            const data = await res.json();
            this.lessons = data;
             if(this.cart.length < 1) {
              window.location.reload();
             }
          } catch (err) {
            console.error("Failed to load lessons", err);
          }
        },
      async fetchCart() {
  try {
    const res = await fetch("http://localhost:5000/api/cart");
    const data = await res.json();
    console.log("res.json", data)

    // Group items by classId and count quantity
    const grouped = {};

    data.forEach(item => {
      if (!grouped[item.classId]) {
        grouped[item.classId] = {
          ...item,
          quantity: item.quantity ?? 1,   // use backend value if exists
        };
      } else {
        grouped[item.classId].quantity += 1;  // increase quantity
      }
    });

    // Convert back to array for v-for
    this.cart = Object.values(grouped);

    console.log("Grouped cart", this.cart);

  } catch (err) {
    console.error("Failed to load cart", err);
  }
}
,
   addToCart(lesson) {
  if (lesson.spaces <= 0) return;

  lesson.spaces--;

  fetch("http://localhost:5000/api/cart/add", {
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
}
,
async searchLessons() {
  if (this.searchQuery.trim() === "") {
    this.fetchLessons();
    return;
  }

  this.searching = true;

  const res = await fetch(
  `http://localhost:5000/api/classes/search?q=${encodeURIComponent(this.searchQuery)}`
  );

  
  const data = await res.json();

  this.lessons = data;
  this.searching = false;
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
// submitCheckout() {
//   this.orderMessage =
//     `Order submitted! Thank you, ${this.checkoutName}. We will contact you at ${this.checkoutPhone}.`;

//   alert(this.orderMessage);

//   this.cart = [];

//   this.checkoutName = "";
//   this.checkoutPhone = "";

//   this.showCart = false;
// },
submitCheckout() {
  this.orderMessage =
    `Order submitted! Thank you, ${this.checkoutName}. We will contact you at ${this.checkoutPhone}.`;

  const lessonIDs = this.cart.map(item => item.classId);
  const quantities = this.cart.map(item => item.quantity);

  fetch("http://localhost:5000/api/checkout", {
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
    // this.showCart = false;
    window.location.reload();
  });
}




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

      mounted() {
        this.fetchLessons();
        this.fetchCart();
      },
    }).mount("#app");
