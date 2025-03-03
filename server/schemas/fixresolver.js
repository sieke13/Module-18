// Find your saveBook resolver and replace it with this:
saveBook: async (parent, { bookData }, context) => {
    console.log('SaveBook mutation called with:', JSON.stringify(bookData));
    console.log('Context:', JSON.stringify(context));
    
    // Check if user is authenticated
    if (!context.user) {
      console.log('No user found in context');
      throw new AuthenticationError('You need to be logged in!');
    }
    
    try {
      console.log(`Finding user with id ${context.user._id}`);
      
      // Use findByIdAndUpdate for more reliability
      const updatedUser = await User.findByIdAndUpdate(
        context.user._id,
        { 
          $addToSet: { 
            savedBooks: {
              bookId: bookData.bookId,
              authors: bookData.authors || [],
              description: bookData.description || '',
              title: bookData.title,
              image: bookData.image || '',
              link: bookData.link || ''
            } 
          } 
        }, 
        { new: true, runValidators: true }
      );
      
      if (!updatedUser) {
        console.log(`No user found with id ${context.user._id}`);
        throw new Error('User not found');
      }
      
      console.log('Book saved successfully. User now has', updatedUser.savedBooks.length, 'books');
      return updatedUser;
    } catch (err) {
      console.error('Error saving book:', err);
      throw new Error(`Failed to save book: ${err.message}`);
    }
  }