import {Injectable} from '@angular/core';
import {CartItem} from '../common/cart-item';
import {BehaviorSubject, Subject} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class CartService {

  cartItems: CartItem[] = [];
  totalPrice: Subject<number> = new BehaviorSubject<number>(0);
  totalQuantity: Subject<number> = new BehaviorSubject<number>(0);

  storages: Storage = localStorage;

  constructor() {

    let data = JSON.parse(this.storages.getItem('cartItems'));

    if (data != null){
      this.cartItems = data;

      this.computeCartTotal();
    }
  }

  addToCart(theCartItem: CartItem) {
    //check if we already have the item in our cart
    //find the item in the cart based on item id
    //check if we found it
    let alreadyExistInCart: boolean = false;
    let existingCartItem: CartItem = undefined;

    if (this.cartItems.length > 0) {

      existingCartItem = this.cartItems.find(tempCartItem => tempCartItem.id === theCartItem.id)

      alreadyExistInCart = (existingCartItem != undefined);

    }
    if (alreadyExistInCart) {
      existingCartItem.quantity++;
    } else {
      this.cartItems.push(theCartItem)
    }

    //compute cart total price & total quantity
    this.computeCartTotal();


  }

  computeCartTotal() {
    let totalPriceValue: number = 0;
    let totalQuantityValue: number = 0;

    for (let currentCartItem of this.cartItems) {
      totalPriceValue += currentCartItem.quantity * currentCartItem.unitPrice;
      totalQuantityValue += currentCartItem.quantity
    }

    // publish the enw value all subscribers receive new data
    this.totalPrice.next(totalPriceValue);
    this.totalQuantity.next(totalQuantityValue);

    this.persistCartItems();

  }

  persistCartItems() {
    this.storages.setItem('cartItems',JSON.stringify(this.cartItems));
  }

  decrementQuantity(theCartItem: CartItem) {

    theCartItem.quantity--;
    if (theCartItem.quantity === 0) {
      this.remove(theCartItem)
    } else {
      this.computeCartTotal();
    }


  }

  remove(theCartItem: CartItem) {
    //get index of item in the array
    const itemIndex = this.cartItems.findIndex(tempCartItem => tempCartItem.id === theCartItem.id);

    //if found, remove the item from the array at the given index
    if (itemIndex > -1) {
      this.cartItems.splice(itemIndex, 1);
      this.computeCartTotal();
    }


  }
}
