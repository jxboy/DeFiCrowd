package api

import (
	"DeFiCrowd/backend/db"
	"encoding/json"
	"log"
	"net/http"
)

func GetStakeBalance(w http.ResponseWriter, r *http.Request) {
	user := r.URL.Query().Get("user")
	if user == "" {
		http.Error(w, "user param required", http.StatusBadRequest)
		return
	}
	balance, earned := db.GetUserStakeInfo(user)
	resp := map[string]interface{}{
		"user":    user,
		"balance": balance,
		"earned":  earned,
	}
	json.NewEncoder(w).Encode(resp)
}

func RunServer(addr string) {
	log.Printf("HTTP server running at %s", addr)
	http.HandleFunc("/stake/info", GetStakeBalance)
	http.ListenAndServe(addr, nil)
}
