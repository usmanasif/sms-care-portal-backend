# CoachMe Health SMS Care Delivery Tool

## Setting Up

#### Tool Dependencies

- Git Clone this repository
- Have MongoDB running locally (we recommend homebrew) or through Docker
- Install relevant NodeJS version as documented in Dockerfile and/or .tool-versions. 
  - We recommend you use [ASDF](https://github.com/asdf-vm/asdf) as a language version manager. 
- Install Yarn Package Manager

#### Editor Setup

This project uses Typescript, ESLint and Prettier. You should ensure you have your editor, or git hooks setup to run these tools automatically. PRs will not be merged if there are compiler, or lint errors. 

We recommend using VSCode as it has very good Typescript support. 


#### Running the Project

1. Make sure you have all tool dependencies installed and running
1. Install project dependencies using `yarn install`
1. Setup your local ENV variables using your prefered shell environment management tool (we like [direnv](https://github.com/direnv/direnv)
1. Run the tests, local server, or typescript compiler using the relevant yarn command. 


## Acknowledgements & Thank You's

* The first version of this tool was built by a volunteer team as part of UPenn Hack4Impact. You can find their work [here](https://github.com/hack4impact-upenn/coach-me-health)
