
    /**
     * Recipe Book Application
     * Fetches recipes from CalorieNinjas API, allows users to browse, save, and manage recipes.
     */
    $(document).ready(function () {
      // State
      let recipes = [];
      let savedRecipes = JSON.parse(localStorage.getItem('savedRecipes')) || [];
      let shoppingList = JSON.parse(localStorage.getItem('shoppingList')) || [];
      let currentRecipe = null;

      /**
       * Fetches recipes from CalorieNinjas API
       * @param {string} query - Search query for recipes
       * @returns {Promise<Array>} Array of recipe objects
       */
      async function fetchRecipes(query = 'popular') {
        try {
          let responseData;
          await $.ajax({
            method: 'GET',
            url: 'https://api.calorieninjas.com/v1/recipe?query=' + encodeURIComponent(query),
            headers: { 'X-Api-Key': 'YOUR_API_KEY' }, // Replace with your CalorieNinjas API key
            contentType: 'application/json',
            success: function (result) {
              responseData = result;
            },
            error: function ajaxError(jqXHR) {
              console.error('Error fetching recipes: ', jqXHR.responseText);
              responseData = [];
            }
          });

          // Normalize API response to app's recipe format
          return responseData.map((recipe, index) => ({
            id: index + 1, // Generate unique ID
            title: recipe.name,
            category: recipe.category || 'Unknown', // API may not provide category; fallback to 'Unknown'
            image: 'https://via.placeholder.com/300', // Placeholder image
            ingredients: recipe.ingredients ? recipe.ingredients.split('|') : [],
            instructions: recipe.instructions ? recipe.instructions.split('. ').filter(step => step) : []
          }));
        } catch (error) {
          console.error('Error in fetchRecipes:', error);
          return [];
        }
      }

      /**
       * Renders the recipe list
       * @param {Array} recipeList - Recipes to display
       */
      function renderRecipeList(recipeList) {
        $('#recipe-list').empty();
        if (recipeList.length === 0) {
          $('#recipe-list').append('<p class="text-gray-600">No recipes found.</p>');
          return;
        }
        recipeList.forEach(recipe => {
          const recipeCard = `
            <div class="bg-white p-4 rounded-md shadow-md cursor-pointer recipe-card" data-id="${recipe.id}">
              <img src="${recipe.image}" alt="${recipe.title}" class="w-full h-40 object-cover rounded-md mb-2">
              <h3 class="text-lg font-semibold">${recipe.title}</h3>
              <p class="text-gray-600">${recipe.category}</p>
            </div>`;
          $('#recipe-list').append(recipeCard);
        });
      }

      /**
       * Renders saved recipes
       */
      function renderSavedRecipes() {
        $('#saved-recipes').empty();
        if (savedRecipes.length === 0) {
          $('#saved-recipes').append('<p class="text-gray-600">No saved recipes.</p>');
          return;
        }
        savedRecipes.forEach(recipe => {
          const recipeCard = `
            <div class="bg-white p-4 rounded-md shadow-md">
              <h3 class="text-lg font-semibold">${recipe.title}</h3>
              <p class="text-gray-600">${recipe.category}</p>
              <input type="text" class="notes-input border p-1 mt-2 w-full" value="${recipe.notes || ''}" placeholder="Add notes..." data-id="${recipe.id}">
              <div class="flex space-x-2 mt-2">
                <button class="view-recipe text-blue-500" data-id="${recipe.id}">View</button>
                <button class="delete-recipe text-red-500" data-id="${recipe.id}">Delete</button>
                <button class="add-to-shopping text-green-500" data-id="${recipe.id}">Add to Shopping List</button>
              </div>
            </div>`;
          $('#saved-recipes').append(recipeCard);
        });
      }

      /**
       * Renders shopping list
       */
      function renderShoppingList() {
        $('#shopping-list-items').empty();
        if (shoppingList.length === 0) {
          $('#shopping-list-items').append('<p class="text-gray-600">No items in shopping list.</p>');
          return;
        }
        shoppingList.forEach((item, index) => {
          const listItem = `
            <li class="flex justify-between py-1">
              <span>${item}</span>
              <button class="remove-shopping-item text-red-500" data-index="${index}">Remove</button>
            </li>`;
          $('#shopping-list-items').append(listItem);
        });
      }

      /**
       * Shows recipe details
       * @param {Object} recipe - Recipe to display
       */
      function showRecipeDetails(recipe) {
        currentRecipe = recipe;
        $('#recipe-title').text(recipe.title);
        $('#recipe-image').attr('src', recipe.image).attr('alt', recipe.title);
        $('#recipe-ingredients').empty();
        recipe.ingredients.forEach(ing => $('#recipe-ingredients').append(`<li>${ing}</li>`));
        $('#recipe-instructions').empty();
        recipe.instructions.forEach(step => $('#recipe-instructions').append(`<li>${step}</li>`));
        $('#home, #my-recipes, #shopping-list').addClass('hidden');
        $('#recipe-details').removeClass('hidden');
      }

      /**
       * Saves recipes to localStorage
       */
      function saveToLocalStorage() {
        localStorage.setItem('savedRecipes', JSON.stringify(savedRecipes));
        localStorage.setItem('shoppingList', JSON.stringify(shoppingList));
      }

      /**
       * Initializes the app with default recipes
       */
      async function init() {
        recipes = await fetchRecipes('popular'); // Fetch default recipes
        renderRecipeList(recipes);
        renderSavedRecipes();
        renderShoppingList();
        $('#home').removeClass('hidden');
      }

      // Initialize
      init();

      // Navigation
      $('nav a').on('click', function (e) {
        e.preventDefault();
        const section = $(this).attr('href').substring(1);
        $('#home, #recipe-details, #my-recipes, #shopping-list').addClass('hidden');
        $(`#${section}`).removeClass('hidden');
        if (section === 'my-recipes') renderSavedRecipes();
        if (section === 'shopping-list') renderShoppingList();
      });

      // Search recipes
      $('#search-button').on('click', async function () {
        const query = $('#search-bar').val().trim();
        const category = $('#category-filter').val();
        if (query) {
          recipes = await fetchRecipes(query);
          const filteredRecipes = recipes.filter(recipe =>
            category === 'all' || recipe.category === category
          );
          renderRecipeList(filteredRecipes);
        }
      });

      // View recipe
      $('#recipe-list').on('click', '.recipe-card', function () {
        const id = parseInt($(this).data('id'));
        const recipe = recipes.find(r => r.id === id) || savedRecipes.find(r => r.id === id);
        if (recipe) showRecipeDetails(recipe);
      });

      // Save recipe
      $('#save-recipe').on('click', function () {
        if (currentRecipe && !savedRecipes.find(r => r.id === currentRecipe.id)) {
          savedRecipes.push({ ...currentRecipe, notes: '' });
          saveToLocalStorage();
          alert('Recipe saved!');
        } else if (savedRecipes.find(r => r.id === currentRecipe.id)) {
          alert('Recipe already saved!');
        }
      });

      // View saved recipe
      $('#saved-recipes').on('click', '.view-recipe', function () {
        const id = parseInt($(this).data('id'));
        const recipe = savedRecipes.find(r => r.id === id);
        if (recipe) showRecipeDetails(recipe);
      });

      // Delete saved recipe
      $('#saved-recipes').on('click', '.delete-recipe', function () {
        const id = parseInt($(this).data('id'));
        savedRecipes = savedRecipes.filter(r => r.id !== id);
        saveToLocalStorage();
        renderSavedRecipes();
      });

      // Update notes
      $('#saved-recipes').on('change', '.notes-input', function () {
        const id = parseInt($(this).data('id'));
        const notes = $(this).val();
        const recipe = savedRecipes.find(r => r.id === id);
        if (recipe) {
          recipe.notes = notes;
          saveToLocalStorage();
        }
      });

      // Add to shopping list
      $('#saved-recipes').on('click', '.add-to-shopping', function () {
        const id = parseInt($(this).data('id'));
        const recipe = savedRecipes.find(r => r.id === id);
        if (recipe) {
          shoppingList.push(...recipe.ingredients);
          saveToLocalStorage();
          renderShoppingList();
        }
      });

      // Remove shopping list item
      $('#shopping-list-items').on('click', '.remove-shopping-item', function () {
        const index = parseInt($(this).data('index'));
        shoppingList.splice(index, 1);
        saveToLocalStorage();
        renderShoppingList();
      });

      // Clear shopping list
      $('#clear-shopping-list').on('click', function () {
        shoppingList = [];
        saveToLocalStorage();
        renderShoppingList();
      });

      // Back to home
      $('#back-to-home').on('click', function () {
        $('#recipe-details').addClass('hidden');
        $('#home').removeClass('hidden');
      });

      // Keyboard navigation
      $('input, select, button, .recipe-card').on('keypress', function (e) {
        if (e.which === 13) $(this).trigger('click');
      });
    });
 