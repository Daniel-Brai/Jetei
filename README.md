# Jetei

![image](https://github.com/Daniel-Brai/Jetei/assets/88239970/d72ee59b-c428-4619-a892-4fb948d90ae4)

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

## Getting Started

To run Jetei locally on your machine, follow these steps:

1. **Prerequeistes**: Ensure you have Node.js and Docker installed on your machine. If not, you can download them from their official website and follow their installation guide.

2. **Clone the Repository**: Use the following command to clone the repository to your local machine:

   ```bash
   git clone https://github.com/Daniel-Brai/Jetei.git
   ```

3. **Configure credentials**: Navigate to the base directory of the Jetei project, configure your empty credentials found in the `.env.local` file.

4. **Run the application**: Start up Docker on your local machine and navigate to the base directory of the Jetei. Use the following command to start the application:

    * **On Linux or MacOS**

      ```bash
      chmod +x ./scripts/docker.local.sh && ./scripts/docker.local.sh up -d
      ```


## Limitations and Minor stuff

1. Currently, Jetei only supports two concurrent users on for the editing of notes to due to the limitations of character wise operational transformation over webssokets. **Note:** An improvement on the conflict resolution on the note editor is planned.

2. Since, the UI is rendered from the server. User experience is not best and as reactive as I would want it to be. You may ask why not use React.js, Next.js, or Astro. Well I wouldn't have as much as I would like and again I would still need to build an API backend for services or use a service like Ably for realtime interactions or Upstash for Redis. I didn't want to deal with all this. Well, the UI will be improved gradually though I would have to write a lot of Javascript.

3. Jetei network payload isn't as optimal as I would like because I have minified the Javascript yet. Though it clocks under 200ms on my machine for rendering and a request back to server to render out a data needed for that page. **Note**: Since Jetei is still very early, I have still working on some UI smells when involve me writing some Javascript to make the data representable on page.

## Contributing

Contributions are welcome! If you encounter any issues with the app or have new feature suggestions, please open an issue or submit a pull request
