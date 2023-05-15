<script>
    export let title = '';
  </script>
  
  <header>
    <div class="left">
      <h1>{title}</h1>
    </div>
    <div class="right">
        <h3>Hold buttons for 3 seconds to activate</h3>
        <div class="button-container">
          <slot></slot>
        </div>
    </div>
  </header>
  
  <style>
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px;
      background-color: #f0f0f0;
    }
  
    .left {
      flex-grow: 1;
    }
  
    .right {
      display: flex;
      gap: 10px;
      flex-direction: column;
      align-items: flex-start;
    }

    .button-container {
      display: flex;
      gap: 10px;
    }
  </style>
  