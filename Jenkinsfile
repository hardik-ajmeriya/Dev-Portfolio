pipeline {
    agent any

    stages {

        stage('Checkout Code') {
            steps {
                echo 'Checking out source code from GitHub'
                checkout scm
            }
        }

        stage('Build Docker Image') {
            steps {
                echo 'Building Docker image for Dev Portfolio'
                sh 'docker build -t dev-portfolio -f docker/Dockerfile .'
            }
        }

    }

    post {
        success {
            echo 'Docker image built successfully!'
        }
        failure {
            echo 'Docker image build failed. Check the logs.'
        }
    }
}
