package example

######################################################################################
# Control Data
######################################################################################
control_data := {
	"coarse_roles": {
		"admins": ["mmb_admin", "acb_admin", "prq_admin"],
		"client_hr": ["client_hr"],
	}
}

default allow = false

######################################################################################
# Helper Functions
######################################################################################
# Function to check whether the user role is Admin
is_admin {
	token.payload.roles[_] == control_data.coarse_roles.admins[_]
}

# Function to check whether the user role is Client HR
is_client_hr {
	token.payload.roles[_] == control_data.coarse_roles.client_hr[_]
}

token = {"payload": payload} {
	[header, payload, signature] := io.jwt.decode(input.jwt)
}

######################################################################################
# Policies
######################################################################################
# Only allow admins to check admin resources
allow {
	input.method == "GET"
	input.path = ["admins", _, "status"]
	is_admin
}

# Allow both admins and client HR to access client resources
allow {
	input.method == "GET"
	input.path = ["clients", _, "status"]
	is_admin
}
allow {
	input.method == "GET"
	input.path = ["clients", _, "status"]
	is_client_hr
}

# Allow everyone to access the health endpoint
allow {
    input.method == "GET"
    input.path = ["health"]
}