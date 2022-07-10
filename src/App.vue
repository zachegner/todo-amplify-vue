<script>
import { API } from "aws-amplify";
import { createTodo, deleteTodo, updateTodo } from "./graphql/mutations";
import { listTodos } from "./graphql/queries";
import { onCreateTodo, onUpdateTodo } from "./graphql/subscriptions";
import { Authenticator } from "@aws-amplify/ui-vue";
import "@aws-amplify/ui-vue/styles.css";

export default {
  name: "app",
  components: {
    Authenticator,
  },
  async created() {
    this.getTodos();
    this.subscribe(onCreateTodo);
  },
  async updated() {
    this.getTodos();
    this.subscribe(onUpdateTodo);
  },
  data() {
    return {
      name: "",
      description: "",
      dueDate: "",
      todos: [],
    };
  },
  methods: {
    showModalValues(id, name, description, dueDate) {
      this.name = name;
      this.description = description;
      this.id = id;
      this.dueDate = dueDate;
    },
    clearValues() {
      this.name = "";
      this.description = "";
      this.dueDate = "";
    },
    cleanDate(date) {
      let splitDate = date.split("-");
      let formattedDate = new Date(
        splitDate[0],
        splitDate[1] - 1,
        splitDate[2]
      );
      return formattedDate.toDateString();
    },
    getCurrentDate() {
      return new Date();
    },
    checkDate(date) {
      let dueDate = new Date(date);
      const diffInMs =
        /* Math.abs */ dueDate.getTime() - this.getCurrentDate().getTime();
      const diffInHours = diffInMs / (60 * 60 * 1000);
      if (diffInHours < 0) {
        return "overdue";
      } else if (diffInHours > 0 && diffInHours < 24) {
        return "soon";
      }
    },
    sortTodos(arr) {
      console.log(arr);
    },
    async createTodo() {
      const date = new Date().toLocaleString();
      const { name, description, dueDate } = this;
      if (!name || !description || !dueDate) return;
      const todo = { name, description, date, dueDate };
      await API.graphql({
        query: createTodo,
        variables: { input: todo },
      });
      this.clearValues();
    },
    async getTodos() {
      const todos = await API.graphql({
        query: listTodos,
      });
      this.todos = todos.data.listTodos.items;
      this.sortTodos(this.todos);
    },
    async updateTodo(todoId, todoName, todoDesc, todoDueDate) {
      if (!todoName || !todoDesc || !todoDueDate) {
        alert("Please complete all fields, and try again");
        return;
      }
      const date = new Date().toLocaleString();
      await API.graphql({
        query: updateTodo,
        variables: {
          input: {
            id: todoId,
            name: todoName,
            description: todoDesc,
            date: date,
            dueDate: todoDueDate,
          },
        },
      });
      this.clearValues();
    },
    async deleteTodo(todoId) {
      const newTodosArray = this.todos.filter((todo) => todo.id !== todoId);
      this.todos = newTodosArray;
      await API.graphql({
        query: deleteTodo,
        variables: { input: { id: todoId } },
      });
    },
    subscribe() {
      API.graphql({
        query: onCreateTodo,
      }).subscribe({
        next: (eventData) => {
          let todo = eventData.value.data.onCreateTodo;
          //console.log(todo);
          //if (this.todos.some((item) => item.name === todo.name)) return; // remove duplications
          this.todos = [...this.todos, todo];
        },
        error: (error) => console.log(error),
      });
      API.graphql({
        query: onUpdateTodo,
        variables: { id: this.id },
      }).subscribe({
        next: (eventData) => {
          let newTodo = eventData.value.data.onUpdateTodo;
          let oldTodoIndex = this.todos.findIndex(
            (item) => item.id === newTodo.id
          );
          this.todos[oldTodoIndex] = newTodo;
        },
      });
    },
  },
};
</script>

<template>
  <div id="app">
    <authenticator>
      <template v-slot="{ user, signOut }">
        <nav class="navbar bg-light mb-2 sticky-top">
          <div class="container-fluid">
            <span class="navbar-brand mb-0 h1"><h1>Todo App</h1></span>
            <div>
              <span class="me-4">{{ user.username }}</span>
              <button class="btn btn-dark" @click="signOut">Sign Out</button>
            </div>
          </div>
        </nav>

        <div @keyup.enter="createTodo" class="container w-75">
          <div class="input-group mb-2">
            <span class="input-group-text" id="basic-addon1">Todo</span>
            <input
              v-model="name"
              type="text"
              class="form-control"
              aria-label="Todo Name"
            />
          </div>
          <div class="input-group mb-2">
            <span class="input-group-text">Description</span>
            <textarea
              v-model="description"
              class="form-control"
              aria-label="Description"
            ></textarea>
          </div>
          <div class="input-group mb-2">
            <span class="input-group-text">Due Date</span>
            <input
              type="date"
              v-model="dueDate"
              class="form-control"
              aria-label="dueDate"
            />
          </div>
          <button class="btn btn-success mb-2" @click="createTodo">
            Create
          </button>
        </div>

        <hr />

        <div class="container my-3 w-50">
          <div class="row">
            <div
              class="border border-2 rounded card col-xl-4 mb-4"
              v-for="item in todos"
              :key="item.id"
            >
              <span
                class="position-absolute top-0 start-50 translate-middle badge rounded-pill bg-warning"
                v-if="checkDate(item.dueDate) === 'soon'"
                >Due Soon</span
              >
              <span
                class="position-absolute top-0 start-50 translate-middle badge rounded-pill bg-danger"
                v-else-if="checkDate(item.dueDate) === 'overdue'"
                >Expired</span
              >
              <span
                class="position-absolute top-0 start-50 translate-middle badge rounded-pill bg-success"
                v-else
                >Pending</span
              >
              <div class="card-body">
                <h2 class="card-title">{{ item.name }}</h2>
                <h5 class="card-text">{{ item.description }}</h5>
                <p class="card-text">Due by: {{ cleanDate(item.dueDate) }}</p>
              </div>
              <div class="btn-group mb-3 mx-3" role="group">
                <button class="btn btn-danger" @click="deleteTodo(item.id)">
                  <i class="bi bi-trash-fill"> Delete</i>
                </button>
                <button
                  data-bs-toggle="modal"
                  data-bs-target="#staticBackdrop"
                  class="btn btn-primary"
                  @click="
                    clearValues;
                    showModalValues(
                      item.id,
                      item.name,
                      item.description,
                      item.dueDate
                    );
                  "
                >
                  <i class="bi bi-pencil-square"> Edit</i>
                </button>
              </div>
              <p class="fw-lighter card-text ms-3 mb-2">
                Created on: {{ item.date }}
              </p>
            </div>
          </div>
        </div>

        <!-- Modal -->
        <div
          class="modal fade"
          id="staticBackdrop"
          data-bs-backdrop="static"
          data-bs-keyboard="false"
          tabindex="-1"
          aria-labelledby="staticBackdropLabel"
          aria-hidden="true"
        >
          <div class="modal-dialog modal-xl">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title" id="staticBackdropLabel">
                  Update Todo
                </h5>
                <button
                  type="button"
                  class="btn-close"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                  @click="clearValues"
                ></button>
              </div>
              <div class="modal-body">
                <div class="mb-3">
                  <label for="exampleFormControlInput1" class="form-label"
                    >Todo</label
                  >
                  <input
                    type="text"
                    class="form-control"
                    id="exampleFormControlInput1"
                    placeholder="Todo name"
                    v-model="this.name"
                  />
                </div>
                <div class="mb-3">
                  <label for="exampleFormControlTextarea1" class="form-label"
                    >Description</label
                  >
                  <textarea
                    class="form-control"
                    id="exampleFormControlTextarea1"
                    rows="3"
                    v-model="this.description"
                  ></textarea>
                </div>
                <div class="mb-3">
                  <label for="exampleFormControlInput1" class="form-label"
                    >Due Date</label
                  >
                  <input
                    type="date"
                    class="form-control"
                    id="exampleFormControlInput1"
                    placeholder="Due Date"
                    v-model="this.dueDate"
                  />
                </div>
              </div>
              <div class="modal-footer">
                <button
                  type="button"
                  class="btn btn-secondary"
                  data-bs-dismiss="modal"
                  @click="clearValues"
                >
                  Cancel
                </button>
                <button
                  v-if="this.name && this.description && this.dueDate"
                  type="button"
                  class="btn btn-primary"
                  data-bs-dismiss="modal"
                  @click="
                    updateTodo(
                      this.id,
                      this.name,
                      this.description,
                      this.dueDate
                    )
                  "
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        </div>
      </template>
    </authenticator>
  </div>
</template>

<style></style>
