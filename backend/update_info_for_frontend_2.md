**Favorites Feature**:
---
**Endpoints**:

-   `POST /api/favorites`: Adds a song to the user's favorites.
-   `DELETE /api/favorites`: Removes a song from the user's favorites.
-   `GET /api/favorites`: Retrieves all favorite songs of the current user.

**Search Feature**:
---
**Endpoints**:

- `GET /api/search`: Searches for songs by title, artist, or album. The query parameter `q` is used for the search term.

**Move Songs in Queue**:
---
**Endpoints**:

- `PUT /api/queue/move`: Moves a song from one position to another in the queue.

**Logic**:

-   When moving a song, the positions of other songs are adjusted accordingly.
-   When removing a song from the queue, positions are updated to fill the gap.

**Extra Notes**:
---
Make sure to use the `@token_required` decorator where necessary (`/api/favorites`).
