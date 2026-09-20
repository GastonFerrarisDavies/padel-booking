# 🎾 Padel Booking Platform: A Cloud-Native & DevSecOps Showcase

[![CI Pipeline](https://img.shields.io/badge/CI-GitHub_Actions-2088FF?style=for-the-badge&logo=github-actions&logoColor=white)](#)
[![CD Pipeline](https://img.shields.io/badge/CD-Argo_CD-EF7B4D?style=for-the-badge&logo=argo&logoColor=white)](#)
[![Orchestration](https://img.shields.io/badge/Kubernetes-326CE5?style=for-the-badge&logo=kubernetes&logoColor=white)](#)
[![Security](https://img.shields.io/badge/DevSecOps-Ready-00C7B7?style=for-the-badge)](#)

> An enterprise-grade, microservices-based booking system designed to demonstrate modern Cloud Engineering, GitOps deployment strategies, and "Security-as-Code" practices. 

## 🏗️ Architecture Overview

This project transitions from traditional monolithic web development to a fully distributed, cloud-native architecture. It utilizes a **GitOps** approach as the single source of truth, ensuring infrastructure immutability and automated reconciliation.

### The Stack
| Layer | Technologies | Purpose |
| :--- | :--- | :--- |
| **Frontend** | Next.js (React), Nginx | Static generation, served by an ultra-lightweight web server. |
| **Backend** | NestJS, Go *(WIP)* | Stateless APIs following the database-per-service pattern. |
| **Database** | MySQL | Stateful workloads managed via Kubernetes PV/PVCs. |
| **Infrastructure** | Kubernetes (Minikube), Docker | Container orchestration and isolated environments. |
| **CI/CD** | GitHub Actions, Argo CD | Automated build, SBOM generation, and GitOps deployments. |

---

## 🔒 DevSecOps & Best Practices Implemented

This repository is built with production-readiness in mind, showcasing key architectural decisions:

*   **GitOps & Immutability:** Argo CD continuously monitors the `/k8s` directory. Manual changes to the cluster are automatically rolled back (`selfHeal: true`), ensuring the GitHub repository remains the absolute source of truth.
*   **Multi-Stage Docker Builds:** Container images are highly optimized. The frontend deployment drops the Node.js runtime entirely, executing on a hardened Nginx Alpine image, drastically reducing the attack surface.
*   **Software Bill of Materials (SBOM):** Integrated CycloneDX in the CI pipeline to generate dependency manifests for continuous vulnerability scanning.
*   **Ingress & API Protection:** Utilizes NGINX Ingress Controller with custom annotations to implement **Rate Limiting**, protecting the underlying microservices from Layer 7 API abuse and brute-force attacks.
*   **Resource Isolation:** Strict use of Kubernetes Namespaces (`padel-dev`) to encapsulate workloads, prevent lateral movement, and manage sensitive secrets safely.

---

## 🚦 Current Project Status

- [x] **Phase 1: Infrastructure & Frontend**
  - Next.js application containerized with multi-stage builds.
  - Kubernetes manifests created (`Deployment`, `Service`, `Ingress`).
  - GitOps pipeline fully operational (GitHub Actions → Argo CD).
- [ ] **Phase 2: Authentication & Storage**
  - Implement MySQL StatefulSets and Persistent Volume Claims (PVCs).
  - Inject database credentials securely via Kubernetes Secrets.
- [ ] **Phase 3: Microservices Integration**
  - Deploy NestJS `user-service`.
  - Implement Role-Based Access Control (RBAC) architecture.

---

## 💻 Local Development Setup

If you want to spin up the current architecture locally using Minikube:

1. **Start the cluster and enable Ingress:**
   ```bash
   minikube start
   minikube addons enable ingress


2. **Apply the GitOps Observer (Argo CD)**
    ``` bash
    kubectl create namespace argocd
    kubectl apply -n argocd -f [https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml](https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml)
    kubectl apply -f argocd/argo.yaml

3. **Access the Application**
    minikube service frontend-service -n padel-dev

    Which creates a tunnel with a public ip to access the app.