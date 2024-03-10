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

3. **Configure credentials**: Navigate to the base directory of the Jetei project, configure your email client to be `sendwave` or `smtp` in the `.env.example` file.

4. **Run the application**: Start up Docker on your local machine and navigate to the base directory of the Jetei. Use the following command to start the application:

    * **On Linux or MacOS**

      ```bash
      chmod +x ./scripts/docker.local.sh && ./scripts/docker.local.sh up -d
      ```

## Contributing

Contributions are welcome! If you encounter any issues with the app or have new feature suggestions, please open an issue or submit a pull request
