# Jetei

![image](https://github.com/Daniel-Brai/Jetei/assets/88239970/e6a4e59c-3859-4586-83b9-2a284af08e78)

## Description

Jetei, a powerful and dynamic real-time collaborative knowledge base application powered by operational transformation designed to empower teams, communities, and individuals to collect, share, and organize information seamlessly.

## Features

<p>✅Real-time collaboration</p>
<p>✅Personalized information organization adapting to your specific needs.</p>
<p>✅Quick information search</p>

## Technolgies Used

* **Nest.js:** A progressive Node.js framework for building efficient, scalable, and maintainable server-side applications. Nest.js leverages TypeScript and follows a modular architecture, making it easy to organize and structure the codebase.
  
* **PostgreSQL** A powerful and open-source relational database management system known for its reliability, data integrity, and extensive SQL compliance. PostgreSQL provides robust support for advanced features like transactions, concurrency control, and data replication, making it an excellent choice for storing and managing Jetei's knowledge base data.
  
* **HTMX** A modern, lightweight library that enhances HTML with powerful client-side functionality. HTMX enables Jetei to deliver a seamless and responsive user experience by enabling real-time updates and interactions without the need for traditional page refreshes or complex JavaScript frameworks.

## Demo 

https://github.com/Daniel-Brai/Jetei/assets/88239970/b3c0d949-f8ea-4c67-8ae6-5d544db06500


## Getting Started

To run Jetei locally on your machine, follow these steps:

1. **Prerequeistes**: Ensure you have Node.js and Docker installed on your machine. If not, you can download them from their official website and follow their installation guide.

2. **Clone the Repository**: Use the following command to clone the repository to your local machine:

   ```bash
   git clone https://github.com/Daniel-Brai/Jetei.git
   ```

3. **Configure credentials**: Navigate to the base directory of the Jetei project, configure the empty credentials found in the `.env.local` file in  a `.env` file.

4. **Run the application**: Start up Docker on your local machine and navigate to the base directory of the Jetei. Use the following command to start the application:

    * **On Linux or MacOS**

      ```bash
      chmod +x ./scripts/docker.sh && ./scripts/docker.sh
      ```


## Limitations and Minor stuff

1. Currently, Jetei only supports *2 concurrent users* on for the editing of notes to due to the limitations of character wise operational transformation over websockets. **Note:** An improvement on the conflict resolution (i.e OT Algorithm) on the note editor is planned.

2. Again, Jetei is being rendered from the server as such user experience is not as reactive as I would want it to be. You may ask why not use React.js, Next.js, or Astro. Well I would still need to build an API backend for some services or use a service like Ably for realtime interactions or Upstash for Redis. I would have to deal with seperation between the client and server. I didn't want to deal with all this so I opted from doing everything with the server. Well, the UI will be improved gradually though I would have to write some Javascript.

3. Jetei network payload isn't as optimal as I would like because I have not minified the Javascript yet and done general optimizations yet. Though it clocks under 200ms on my local machine for rendering and a request back to server to render out a data needed for that page but in free cloud environment **Note**: Since Jetei is still very early, I have still working on some UI smells when involve me writing some Javascript to make the data representable on page.

4. I would need to optimise the database schema by least breaking down tables to a maximum of 3NF, take into account referential integrity contraints, and add indexes wherever necessary.

## Contributing

Contributions are welcome! If you encounter any issues with the app or have new feature suggestions, please open an issue or submit a pull request
