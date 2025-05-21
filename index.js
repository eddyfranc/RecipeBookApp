$(document).ready(function () {
    let savedRecipes = JSON.parse(localStorage.getItem('savedRecipes')) || [];
    let recipeRatings = JSON.parse(localStorage.getItem('recipeRatings')) || {};
    const api= "7kJL1SrfxWA7zEGetJAo4znSIa02QORJBZc7YTEQ";

    // Search Recipes
    $('#search-btn').click(searchRecipes);
    $('#search-input').on('keypress', function (e) {
        if (e.which === 13) searchRecipes();
    });

    function searchRecipes() {
        const query = $('#search-input').val().trim();
        if (!query) return;

        $.ajax({
            method: 'GET',
            url: `https://api.calorieninjas.com/v1/recipe?query=${encodeURIComponent(query)}`,
            headers: { 'X-Api-Key': api },
            contentType: 'application/json',
            success: function (result) {
                displayRecipes(result);
            },
            error: function (jqXHR) {
                console.error('Error: ', jqXHR.responseText);
                $('#recipes-container').html('<p class="text-red-600">Error fetching recipes. Please try again.</p>');
            }
        });
    }

    function displayRecipes(recipes) {
        const filter = $('#category-filter').val();
        $('#recipes-container').empty();

        recipes.forEach(recipe => {
            const category = categorizeRecipe(recipe.title);
            if (filter === 'all' || filter === category) {
                const isSaved = savedRecipes.some(r => r.title === recipe.title);
                const ratings = recipeRatings[recipe.title] || [];
                const avgRating = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : 'No ratings';
                const recipeCard = `
                    <div class="bg-white p-4 rounded shadow" role="article">
                        <h3 class="text-lg font-bold">${recipe.title}</h3>
                        <p class="text-gray-600">Category: ${category}</p>
                        <p class="text-gray-600">Rating: ${avgRating} (${ratings.length} votes)</p>
                        <img src="https://via.placeholder.com/150" alt="${recipe.title}" class="w-full h-40 object-cover rounded my-2">
                        <p><strong>Ingredients:</strong> ${recipe.ingredients}</p>
                        <p><strong>Instructions:</strong> ${recipe.instructions}</p>
                        <div class="flex space-x-2 mt-2">
                            <button class="save-recipe bg-blue-600 text-white p-2 rounded hover:bg-blue-700" 
                                    data-title="${recipe.title}" 
                                    data-ingredients="${recipe.ingredients}" 
                                    data-instructions="${recipe.instructions}"
                                    data-category="${category}"
                                    aria-label="${isSaved ? 'Remove from' : 'Save to'} recipe book">
                                ${isSaved ? 'Remove from' : 'Save to'} Recipe Book
                            </button>
                            <button class="rate-recipe bg-yellow-600 text-white p-2 rounded hover:bg-yellow-700" 
                                    data-title="${recipe.title}"
                                    aria-label="Rate this recipe">Rate</button>
                        </div>
                        <div class="mt-2">
                            <a href="https://twitter.com/intent/tweet?text=Check out this recipe: ${recipe.title}&url=${window.location.href}" 
                               target="_blank" 
                               class="text-blue-600 hover:underline" 
                               aria-label="Share on Twitter">Share on Twitter</a>
                            <a href="https://www.facebook.com/sharer/sharer.php?u=${window.location.href}" 
                               target="_blank" 
                               class="text-blue-600 hover:underline ml-2" 
                               aria-label="Share on Facebook">Share on Facebook</a>
                        </div>
                    </div>
                `;
                $('#recipes-container').append(recipeCard);
            }
        });
    }

    // Categorize Recipes
    function categorizeRecipe(title) {
        title = title.toLowerCase();
        if (title.includes('italian') || title.includes('risotto') || title.includes('pasta')) return 'Italian';
        if (title.includes('taco') || title.includes('salsa') || title.includes('mexican')) return 'Mexican';
        if (title.includes('curry') || title.includes('sushi') || title.includes('asian')) return 'Asian';
        return 'American';
    }

    // Category Filter
    $('#category-filter').change(searchRecipes);

    // Save/Remove Recipe
    $(document).on('click', '.save-recipe', function () {
        const button = $(this);
        const recipe = {
            title: button.data('title'),
            ingredients: button.data('ingredients'),
            instructions: button.data('instructions'),
            category: button.data('category')
        };

        const isSaved = savedRecipes.some(r => r.title === recipe.title);
        if (isSaved) {
            savedRecipes = savedRecipes.filter(r => r.title !== recipe.title);
            button.text('Save to Recipe Book').attr('aria-label', 'Save to recipe book');
        } else {
            savedRecipes.push(recipe);
            button.text('Remove from Recipe Book').attr('aria-label', 'Remove from recipe book');
        }

        localStorage.setItem('savedRecipes', JSON.stringify(savedRecipes));
    });

    // Rate Recipe
    $(document).on('click', '.rate-recipe', function () {
        const title = $(this).data('title');
        const rating = prompt('Rate this recipe (1-5):', '5');
        const numRating = parseInt(rating);

        if (numRating >= 1 && numRating <= 5) {
            if (!recipeRatings[title]) recipeRatings[title] = [];
            recipeRatings[title].push(numRating);
            localStorage.setItem('recipeRatings', JSON.stringify(recipeRatings));
            searchRecipes(); // Refresh display
        } else {
            alert('Please enter a rating between 1 and 5.');
        }
    });

    // Initial Load
    searchRecipes();
});