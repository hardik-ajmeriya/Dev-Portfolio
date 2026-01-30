pipeline{
    agent any

    stages {
        stage('Checkout Code'){
            steps{
                echo 'Checking out Source code from GitHub'
                checkout scm
            }
        }

        stage('Build Docker Image'){
            steps{
                echo 'Building Docker Image for Dev Portfolio'
                sh 'docker build -t dev-portfolio -f docker/Dockerfile .'
            }
        }
    }
    post{
        echo 'Docker Image Build Successfully!'
    }
    failure{
        echo 'Docker build failed. Check Logs'
    }
}